import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';
import { User } from '@/database/user.model';
import { Project } from '@/database/project.model';
import { AuditLog } from '@/database/audit.model';

// GET /api/projects/[id]/users - Get all users assigned to a project
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

        const { id: projectId } = await params;
    
    // Check if user has access to this project
    const currentUserAccess = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      isActive: true,
    });

    if (!currentUserAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all users assigned to this project
    const projectUsers = await ProjectUser.find({ 
      projectId, 
      isActive: true 
    }).populate('userId', 'name email');

    return NextResponse.json(projectUsers);
  } catch (error) {
    console.error('Error fetching project users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[id]/users - Assign a user to a project
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

        const { id: projectId } = await params;
    
    // Check if user has admin access to this project
    const currentUserAccess = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      role: 'admin',
      isActive: true,
    });

    if (!currentUserAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'reviewer', 'screener', 'extractor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ email: userId, isActive: true });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already assigned to this project
    const existingAssignment = await ProjectUser.findOne({
      projectId,
      userId,
    });

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        return NextResponse.json({ error: 'User is already assigned to this project' }, { status: 409 });
      } else {
        // Reactivate the assignment
        existingAssignment.isActive = true;
        existingAssignment.role = role;
        existingAssignment.assignedBy = session.user.email;
        existingAssignment.assignedAt = new Date();
        await existingAssignment.save();

        // Log the action
        const auditLog = new AuditLog({
          projectId,
          userId: session.user.email,
          action: 'user_assigned',
          details: { 
            assignedUserId: userId, 
            role,
            action: 'reactivated'
          },
        });
        await auditLog.save();

        return NextResponse.json(existingAssignment);
      }
    }

    // Create new assignment
    const projectUser = new ProjectUser({
      projectId,
      userId,
      role,
      assignedBy: session.user.email,
    });

    await projectUser.save();

    // Log the action
    const auditLog = new AuditLog({
      projectId,
      userId: session.user.email,
      action: 'user_assigned',
      details: { 
        assignedUserId: userId, 
        role,
        action: 'assigned'
      },
    });
    await auditLog.save();

    return NextResponse.json(projectUser, { status: 201 });
  } catch (error) {
    console.error('Error assigning user to project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
