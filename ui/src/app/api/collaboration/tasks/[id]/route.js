import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';

// Mock tasks storage - in production, this would be a database
let tasks = [];

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    const { status, assignedTo, priority, dueDate, description } = await request.json();

    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = tasks[taskIndex];

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId: task.projectId,
      userId: session.user.email,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update task
    const updatedTask = {
      ...task,
      ...(status !== undefined && { 
        status,
        ...(status === 'completed' && { completedAt: new Date().toISOString() })
      }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate }),
      ...(description !== undefined && { description }),
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;

    return NextResponse.json({
      success: true,
      task: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
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

    const { id: taskId } = await params;

    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = tasks[taskIndex];

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId: task.projectId,
      userId: session.user.email,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    tasks.splice(taskIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
