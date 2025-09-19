import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Document } from '@/database/document.model';
import { ProjectUser } from '@/database/projectUser.model';
import { AuditLog } from '@/database/audit.model';

// GET /api/projects/[id]/documents/[documentId] - Get document details
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId } = await params;
    
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

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/documents/[documentId] - Update document
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId } = await params;
    
    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();

    // Update document
    const updatedDocument = await Document.findOneAndUpdate(
      { id: documentId, projectId },
      { 
        ...body,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'document_updated',
      details: { 
        documentId, 
        changes: Object.keys(body) 
      },
    });

    await auditLog.save();

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/documents/[documentId] - Delete document
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId } = await params;
    
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

    // Delete document
    const deletedDocument = await Document.findOneAndDelete({ 
      id: documentId, 
      projectId 
    });

    if (!deletedDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'document_deleted',
      details: { 
        documentId,
        fileName: deletedDocument.fileName 
      },
    });

    await auditLog.save();

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
