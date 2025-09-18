import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Project } from '@/database/project.model';
import { ProjectUser } from '@/database/projectUser.model';
import { Document } from '@/database/document.model';
import { AuditLog } from '@/database/audit.model';

// GET /api/projects/[id] - Get project details
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

    // Get project details
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get project statistics
    const documentCount = await Document.countDocuments({ projectId });
    const screenedCount = await Document.countDocuments({ 
      projectId, 
      'screening.decision': { $in: ['included', 'excluded'] } 
    });
    const includedCount = await Document.countDocuments({ 
      projectId, 
      'screening.decision': 'included' 
    });

    // Get team members
    const teamMembers = await ProjectUser.find({ 
      projectId, 
      isActive: true 
    }).populate('userId', 'name email');

    const projectData = {
      ...project.toObject(),
      statistics: {
        totalDocuments: documentCount,
        screenedDocuments: screenedCount,
        includedDocuments: includedCount,
        excludedDocuments: screenedCount - includedCount,
      },
      teamMembers: teamMembers.map(member => ({
        userId: member.userId,
        role: member.role,
        assignedAt: member.assignedAt,
      })),
    };

    return NextResponse.json(projectData);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: projectId } = await params;
    const body = await request.json();

    // Check if user has admin access
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      role: 'admin',
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update project
    const updatedProject = await Project.findOneAndUpdate(
      { id: projectId },
      { 
        ...body,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'project_updated',
      details: { changes: body },
    });

    await auditLog.save();

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: projectId } = await params;

    // Check if user has admin access
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      role: 'admin',
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete project and related data
    await Project.findOneAndDelete({ id: projectId });
    await ProjectUser.deleteMany({ projectId });
    await Document.deleteMany({ projectId });
    await AuditLog.deleteMany({ projectId });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
