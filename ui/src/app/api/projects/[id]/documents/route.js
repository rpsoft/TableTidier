import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Document } from '@/database/document.model';
import { ProjectUser } from '@/database/projectUser.model';
import { AuditLog } from '@/database/audit.model';
import * as cheerio from 'cheerio';

// GET /api/projects/[id]/documents - Get all documents for a project
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: projectId } = await params;
    
    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get documents for this project
    const documents = await Document.find({ projectId })
      .sort({ createdAt: -1 })
      .select('id fileName metadata status tables screening extractedData createdAt updatedAt');

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[id]/documents - Upload a new document
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: projectId } = await params;
    
    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      return NextResponse.json({ error: 'Only HTML files are supported' }, { status: 400 });
    }

    const fileContent = await file.text();
    
    // Parse HTML content
    const $ = cheerio.load(fileContent);
    
    // Extract metadata
    const metadata = {
      title: $('title').text() || $('h1').first().text() || file.name,
      authors: extractAuthors($),
      journal: extractJournal($),
      year: extractYear($),
      doi: extractDOI($),
      abstract: extractAbstract($),
      keywords: extractKeywords($),
    };

    // Extract tables
    const tables = [];
    $('table').each((index, table) => {
      const tableData = parseTable($, $(table));
      tables.push({
        id: `table_${Date.now()}_${index}`,
        headers: tableData.headers,
        rows: tableData.rows,
        annotations: { columns: {}, rows: {} },
        htmlContent: $(table).html(),
      });
    });

    // Extract text sections
    const text = extractTextSections($);

    // Create document
    const document = new Document({
      projectId,
      fileName: file.name,
      originalContent: fileContent,
      metadata,
      text,
      tables,
      uploadedBy: session.user.email,
    });

    await document.save();

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'document_uploaded',
      details: { 
        documentId: document.id, 
        fileName: file.name,
        tableCount: tables.length 
      },
    });

    await auditLog.save();

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for metadata extraction
function extractAuthors($) {
  const authors = [];
  
  // Try different selectors for authors
  $('meta[name="author"], meta[name="authors"], .author, .authors').each((i, el) => {
    const content = $(el).attr('content') || $(el).text();
    if (content) {
      authors.push(...content.split(/[,;]/).map(a => a.trim()).filter(Boolean));
    }
  });
  
  return [...new Set(authors)]; // Remove duplicates
}

function extractJournal($) {
  return $('meta[name="journal"], .journal').attr('content') || 
         $('meta[name="journal"], .journal').text() || 
         $('meta[name="publication"], .publication').attr('content') ||
         $('meta[name="publication"], .publication').text() || '';
}

function extractYear($) {
  const yearText = $('meta[name="year"], .year, .date').attr('content') || 
                   $('meta[name="year"], .year, .date').text() || '';
  const yearMatch = yearText.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}

function extractDOI($) {
  return $('meta[name="doi"], .doi').attr('content') || 
         $('meta[name="doi"], .doi').text() || 
         $('a[href*="doi.org"]').attr('href') || '';
}

function extractAbstract($) {
  return $('meta[name="abstract"], .abstract, .summary').attr('content') || 
         $('meta[name="abstract"], .abstract, .summary').text() || '';
}

function extractKeywords($) {
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  return keywords.split(/[,;]/).map(k => k.trim()).filter(Boolean);
}

function extractTextSections($) {
  const sections = [];
  
  // Common section headers
  const sectionHeaders = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion', 'references'];
  
  sectionHeaders.forEach(section => {
    const content = $(`.${section}, #${section}, [class*="${section}"]`).text().trim();
    if (content) {
      sections.push({
        section,
        content,
        highlights: [],
      });
    }
  });
  
  return sections;
}

function parseTable($, $table) {
  const headers = [];
  const rows = [];
  
  // Get all rows
  $table.find('tr').each((rowIndex, row) => {
    const rowData = [];
    $(row).find('td, th').each((cellIndex, cell) => {
      const $cell = $(cell);
      const colspan = parseInt($cell.attr('colspan') || '1');
      const rowspan = parseInt($cell.attr('rowspan') || '1');
      const cellText = $cell.text().trim();
      
      rowData.push(cellText);
      
      // Handle colspan by adding empty cells
      for (let i = 1; i < colspan; i++) {
        rowData.push('');
      }
    });
    
    if (rowIndex === 0 || $table.find('th').length > 0) {
      headers.push(rowData);
    } else {
      rows.push(rowData);
    }
  });
  
  return { headers, rows };
}
