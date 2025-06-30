import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Collection } from '@/database/collection.model';
import { Document } from '@/database/document.model';
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

    const documents = await Document.find({ 
      collectionId: resolvedParams.id,
      userId: session.user.email 
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
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

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    
    // Extract document name from file name (remove extension)
    const documentName = file.name.replace(/\.[^/.]+$/, "");

    const document = await Document.create({
      collectionId: resolvedParams.id,
      userId: session.user.email,
      name: documentName,
      fileName: file.name,
      htmlContent: fileContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 