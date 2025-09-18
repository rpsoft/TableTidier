import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Mock workflow storage - in production, this would be a database
let workflows = [];

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const workflow = workflows.find(wf => wf.id === workflowId);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workflow
    });

  } catch (error) {
    console.error('Get workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const body = await request.json();
    const { status, progress, currentStep, assignedUsers } = body;

    const workflowIndex = workflows.findIndex(wf => wf.id === workflowId);
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = workflows[workflowIndex];
    
    // Update workflow
    const updatedWorkflow = {
      ...workflow,
      ...(status !== undefined && { status }),
      ...(progress !== undefined && { progress }),
      ...(currentStep !== undefined && { currentStep }),
      ...(assignedUsers !== undefined && { assignedUsers }),
      updatedAt: new Date().toISOString(),
      ...(status === 'running' && !workflow.startedAt && { startedAt: new Date().toISOString() }),
      ...(status === 'completed' && { completedAt: new Date().toISOString() })
    };

    workflows[workflowIndex] = updatedWorkflow;

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow
    });

  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const workflowIndex = workflows.findIndex(wf => wf.id === workflowId);
    
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    workflows.splice(workflowIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('Delete workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
