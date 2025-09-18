import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';

// Mock tasks storage - in production, this would be a database
let tasks = [];

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');

    // Check if user has access to this project
    if (projectId) {
      const projectUser = await ProjectUser.findOne({
        projectId,
        userId: session.user.email,
      });

      if (!projectUser) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Filter tasks
    let filteredTasks = tasks;
    if (projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === projectId);
    }
    if (assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === assignedTo);
    }
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    return NextResponse.json({
      success: true,
      tasks: filteredTasks,
      count: filteredTasks.length
    });

  } catch (error) {
    console.error('Get tasks error:', error);
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

    const { 
      projectId, 
      title, 
      description, 
      assignedTo, 
      priority = 'medium', 
      dueDate, 
      type = 'general',
      documentId,
      tableId
    } = await request.json();

    if (!projectId || !title) {
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

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title,
      description: description || '',
      assignedTo: assignedTo || session.user.email,
      priority,
      status: 'pending',
      type,
      documentId: documentId || null,
      tableId: tableId || null,
      dueDate: dueDate || null,
      createdBy: session.user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      tags: [],
      comments: []
    };

    tasks.push(newTask);

    return NextResponse.json({
      success: true,
      task: newTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
