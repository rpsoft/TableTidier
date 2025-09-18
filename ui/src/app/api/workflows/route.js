import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';

// Mock workflow storage - in production, this would be a database
let workflows = [];

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Filter workflows by project and user access
    let userWorkflows = workflows;
    if (projectId) {
      userWorkflows = workflows.filter(wf => wf.projectId === projectId);
    }

    return NextResponse.json({
      success: true,
      workflows: userWorkflows,
      count: userWorkflows.length
    });

  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, template, steps, assignedUsers = [] } = body;

    if (!projectId || !name || !template || !steps) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const newWorkflow = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name,
      template,
      status: 'draft',
      progress: 0,
      currentStep: 0,
      steps,
      assignedUsers,
      createdBy: session.user.email,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      updatedAt: new Date().toISOString()
    };

    workflows.push(newWorkflow);

    return NextResponse.json({
      success: true,
      workflow: newWorkflow
    });

  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
