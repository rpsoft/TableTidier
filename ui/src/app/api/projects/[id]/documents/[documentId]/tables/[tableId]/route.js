import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Document } from '@/database/document.model';
import { ProjectUser } from '@/database/projectUser.model';
import { AuditLog } from '@/database/audit.model';

// GET /api/projects/[id]/documents/[documentId]/tables/[tableId] - Get table details
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId, tableId } = await params;
    
    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get document
    const document = await Document.findOne({ 
      id: documentId, 
      projectId 
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Find the specific table
    const table = document.tables?.find(t => t.id === tableId);
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/documents/[documentId]/tables/[tableId] - Update table
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId, tableId } = await params;
    
    // Check if user has editing access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      role: { $in: ['admin', 'reviewer', 'extractor'] },
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Editing access required' }, { status: 403 });
    }

    const body = await request.json();
    const { htmlContent, annotations, ...otherUpdates } = body;

    // Get document
    const document = await Document.findOne({ 
      id: documentId, 
      projectId 
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Find and update the specific table
    const tableIndex = document.tables?.findIndex(t => t.id === tableId);
    if (tableIndex === -1) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Update table data
    const updatedTable = {
      ...document.tables[tableIndex],
      ...otherUpdates,
      updatedAt: new Date(),
    };

    if (htmlContent) {
      updatedTable.htmlContent = htmlContent;
    }

    if (annotations) {
      updatedTable.annotations = {
        ...updatedTable.annotations,
        ...annotations,
      };
    }

    document.tables[tableIndex] = updatedTable;
    document.updatedAt = new Date();

    await document.save();

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'table_updated',
      details: { 
        documentId,
        tableId,
        changes: Object.keys(body) 
      },
    });

    await auditLog.save();

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/documents/[documentId]/tables/[tableId] - Delete table
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId, tableId } = await params;
    
    // Check if user has admin access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      role: 'admin',
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get document
    const document = await Document.findOne({ 
      id: documentId, 
      projectId 
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Remove the table
    const initialLength = document.tables?.length || 0;
    document.tables = document.tables?.filter(t => t.id !== tableId) || [];
    document.updatedAt = new Date();

    await document.save();

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'table_deleted',
      details: { 
        documentId,
        tableId 
      },
    });

    await auditLog.save();

    return NextResponse.json({ 
      message: 'Table deleted successfully',
      tablesRemaining: document.tables.length 
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
