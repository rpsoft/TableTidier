import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Collection } from '@/database/collection.model';
import { Document } from '@/database/document.model';
import { Table } from '@/database/table.model';
import dbConnect from '@/database/connection';

export async function GET(request, { params }) {
  try {
    await dbConnect();
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

    const document = await Document.findOne({
      id: resolvedParams.documentId,
      collectionId: resolvedParams.id,
      userId: session.user.email,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const table = await Table.findOne({
      id: resolvedParams.tableId,
      documentId: resolvedParams.documentId,
      collectionId: resolvedParams.id,
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
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

    const document = await Document.findOne({
      id: resolvedParams.documentId,
      collectionId: resolvedParams.id,
      userId: session.user.email,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const table = await Table.findOneAndDelete({
      id: resolvedParams.tableId,
      documentId: resolvedParams.documentId,
      collectionId: resolvedParams.id,
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Update document's table count
    await Document.findByIdAndUpdate(resolvedParams.documentId, {
      $inc: { tableCount: -1 },
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 