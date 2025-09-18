import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';

// Mock comments storage - in production, this would be a database
let comments = [];

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const documentId = searchParams.get('documentId');
    const tableId = searchParams.get('tableId');

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Filter comments based on context
    let filteredComments = comments;
    if (projectId) {
      filteredComments = filteredComments.filter(comment => comment.projectId === projectId);
    }
    if (documentId) {
      filteredComments = filteredComments.filter(comment => comment.documentId === documentId);
    }
    if (tableId) {
      filteredComments = filteredComments.filter(comment => comment.tableId === tableId);
    }

    return NextResponse.json({
      success: true,
      comments: filteredComments,
      count: filteredComments.length
    });

  } catch (error) {
    console.error('Get comments error:', error);
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

    const { projectId, documentId, tableId, content, type = 'general', parentId = null } = await request.json();

    if (!projectId || !content) {
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

    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      documentId: documentId || null,
      tableId: tableId || null,
      content,
      type,
      parentId,
      author: {
        id: session.user.email,
        name: session.user.name || session.user.email,
        email: session.user.email
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: false,
      reactions: [],
      mentions: []
    };

    comments.push(newComment);

    return NextResponse.json({
      success: true,
      comment: newComment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
