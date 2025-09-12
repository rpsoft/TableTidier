import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Collection } from '@/database/collection.model';
import { Table } from '@/database/table.model';
import { canAccessCollection } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const collection = await Collection.findOne({
      id: resolvedParams.id,
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check if user can access this collection
    if (!canAccessCollection(session, collection.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tables = await Table.find({ collectionId: resolvedParams.id });
    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const collection = await Collection.findOne({
      id: resolvedParams.id,
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check if user can access this collection
    if (!canAccessCollection(session, collection.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    if (!fileContent.includes('<table')) {
      return NextResponse.json(
        { error: 'The file must contain at least one table tag' },
        { status: 400 }
      );
    }

    const table = await Table.create({
      collectionId: resolvedParams.id,
      htmlContent: fileContent,
      fileName: file.name,
      createdAt: new Date(),
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error uploading table:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 