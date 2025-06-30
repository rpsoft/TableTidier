import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Collection } from '@/database/collection.model';
import { Document } from '@/database/document.model';
import { Table } from '@/database/table.model';
import { JSDOM } from 'jsdom';
import dbConnect from '@/database/connection';

// Function to extract tables from HTML content using jsdom
function extractTablesFromHTMLServer(htmlContent) {
  const tables = [];
  
  try {
    // Create a DOM from the HTML content
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Find all table elements
    const tableElements = document.querySelectorAll('table');
    
    tableElements.forEach((table, index) => {
      // Get the outer HTML of the table
      const tableHTML = table.outerHTML;
      
      // Create a meaningful filename based on table content or position
      let fileName = `table_${index + 1}.html`;
      
      // Try to find a caption or title for the table
      const caption = table.querySelector('caption');
      if (caption && caption.textContent.trim()) {
        const captionText = caption.textContent.trim().replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
        fileName = `${captionText}_table_${index + 1}.html`;
      }
      
      tables.push({
        htmlContent: tableHTML,
        fileName: fileName,
      });
    });
    
  } catch (error) {
    console.error('Error parsing HTML with jsdom:', error);
    // Fallback to regex method if jsdom fails
    return extractTablesFromHTMLRegex(htmlContent);
  }
  
  return tables;
}

// Fallback function using regex (less reliable but works as backup)
function extractTablesFromHTMLRegex(htmlContent) {
  const tables = [];
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let match;
  let index = 1;
  
  while ((match = tableRegex.exec(htmlContent)) !== null) {
    tables.push({
      htmlContent: match[0],
      fileName: `table_${index}.html`,
    });
    index++;
  }
  
  return tables;
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const collection = await Collection.findOne({
      id: resolvedParams.id,
      userId: session.user.email,
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const document = await Document.findOne({
      id: resolvedParams.documentId,
      collectionId: resolvedParams.id,
      userId: session.user.email,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Extract tables from the document's HTML content
    const extractedTables = extractTablesFromHTMLServer(document.htmlContent);
    
    if (extractedTables.length === 0) {
      return NextResponse.json({ 
        message: 'No tables found in the document',
        extractedCount: 0 
      });
    }

    // Create table records for each extracted table
    const createdTables = [];
    for (const tableData of extractedTables) {
      const table = await Table.create({
        documentId: document._id,
        collectionId: collection._id,
        htmlContent: tableData.htmlContent,
        fileName: tableData.fileName,
        createdAt: new Date(),
      });
      createdTables.push(table);
    }

    // Update document's table count using MongoDB _id
    await Document.findByIdAndUpdate(document._id, {
      tableCount: extractedTables.length,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: `Successfully extracted ${extractedTables.length} tables`,
      extractedCount: extractedTables.length,
      tables: createdTables,
    });
  } catch (error) {
    console.error('Error extracting tables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 