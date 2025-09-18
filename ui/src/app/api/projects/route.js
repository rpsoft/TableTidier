import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Project } from '@/database/project.model';
import { ProjectUser } from '@/database/projectUser.model';
import { AuditLog } from '@/database/audit.model';

// GET /api/projects - Get all projects for the current user
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projects where user is assigned
    const projectUsers = await ProjectUser.find({ 
      userId: session.user.email,
      isActive: true 
    }).populate('projectId');

    const projectIds = projectUsers.map(pu => pu.projectId);
    const projects = await Project.find({ 
      id: { $in: projectIds } 
    }).sort({ updatedAt: -1 });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, researchQuestion, criteria } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Create project
    const project = new Project({
      name,
      description,
      researchQuestion,
      criteria: criteria || { inclusion: [], exclusion: [] },
      createdBy: session.user.email,
    });

    await project.save();

    // Assign creator as admin
    const projectUser = new ProjectUser({
      projectId: project.id,
      userId: session.user.email,
      role: 'admin',
      assignedBy: session.user.email,
    });

    await projectUser.save();

    // Log the action
    const auditLog = new AuditLog({
      projectId: project.id,
      userId: session.user.email,
      action: 'project_created',
      details: { projectName: name },
    });

    await auditLog.save();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
