import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Document } from '@/database/document.model';
import { ProjectUser } from '@/database/projectUser.model';
import { AuditLog } from '@/database/audit.model';

// POST /api/projects/[id]/documents/[documentId]/screening - Record screening decision
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, documentId } = await params;
    
    // Check if user has screening access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      role: { $in: ['admin', 'reviewer', 'screener'] },
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Screening access required' }, { status: 403 });
    }

    const body = await request.json();
    const { decision, reason } = body;

    if (!decision) {
      return NextResponse.json({ error: 'Decision is required' }, { status: 400 });
    }

    // Validate decision
    const validDecisions = ['included', 'excluded', 'pending'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Get document
    const document = await Document.findOne({ 
      id: documentId, 
      projectId 
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Add screening decision
    const screeningEntry = {
      userId: session.user.email,
      decision,
      reason: reason || '',
      timestamp: new Date(),
    };

    document.screening.push(screeningEntry);
    
    // Update document status based on decision
    if (decision === 'included' || decision === 'excluded') {
      document.status = 'screened';
    }

    await document.save();

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'document_screened',
      details: { 
        documentId, 
        decision,
        reason: reason || ''
      },
    });

    await auditLog.save();

    return NextResponse.json({ 
      message: 'Screening decision recorded successfully',
      screening: screeningEntry 
    });
  } catch (error) {
    console.error('Error recording screening decision:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/projects/[id]/documents/[documentId]/screening - Get screening history
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

    // Get document screening history
    const document = await Document.findOne({ 
      id: documentId, 
      projectId 
    }).select('screening');

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document.screening || []);
  } catch (error) {
    console.error('Error fetching screening history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
