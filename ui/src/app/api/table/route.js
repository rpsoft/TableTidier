import clientPromise from "@/mongodb";
import { Table } from "@/database/table.model";
import { NextResponse } from "next/server";

export async function PUT(req) {
  // debugger;
  try {
    const { id, updateData } = await req.json();

    console.log(req);
    console.log(id);
    console.log(updateData);
    if (!id || !updateData) {
      return NextResponse.json(
        { error: "ID and updateData are required" },
        { status: 400 },
      );
    }

    await clientPromise; // Ensure database is connected

    const updatedTable = await Table.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTable, { status: 200 });
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
