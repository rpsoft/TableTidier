import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Collection } from '@/database/collection.model';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const collection = await Collection.findOne({
      id: resolvedParams.id,
      userId: session.user.email,
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { description } = await request.json();
    if (typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    const collection = await Collection.findOneAndUpdate(
      { id: resolvedParams.id, userId: session.user.email },
      { description, updatedAt: new Date() },
      { new: true }
    );

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error updating collection description:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 