import clientPromise from "@/mongodb";
import { Table } from "@/database/table.model";
import { Collection } from "@/database/collection.model";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessCollection } from "@/lib/permissions";

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, updateData } = await req.json();

    if (!id || !updateData) {
      return NextResponse.json(
        { error: "ID and updateData are required" },
        { status: 400 },
      );
    }

    await clientPromise; // Ensure database is connected

    // First, find the table to get its collection
    const table = await Table.findOne({ id });
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Find the collection to check ownership
    const collection = await Collection.findOne({ id: table.collectionId });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Check if user can access this collection
    if (!canAccessCollection(session, collection.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure we don't modify ownership fields
    const sanitizedUpdateData = { ...updateData };
    delete sanitizedUpdateData.userId;
    delete sanitizedUpdateData.collectionId;
    delete sanitizedUpdateData.id;

    const updatedTable = await Table.findOneAndUpdate(
      { id },
      { $set: sanitizedUpdateData },
      { new: true, runValidators: true },
    );

    return NextResponse.json(updatedTable, { status: 200 });
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
