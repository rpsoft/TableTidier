"use server";
import fs from "node:fs/promises";
import { revalidatePath } from "next/cache";

import { Table } from "@/database/table.model";

export async function uploadTable(formData) {
  const file = formData.get("file");
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await fs.writeFile(`./public/uploads/${file.name}`, buffer);

  new Table({
    fileName: file.name,
    htmlContent: new TextDecoder("utf-8").decode(buffer),
  }).save();

  revalidatePath("/");
}

export async function updateTable(tableData) {
  try {
    // Ensure we're working with a plain JavaScript object
    const plainTableData = JSON.parse(JSON.stringify(tableData));
    
    let updatedTable;
    // If tableData is an object with id and updateData properties
    if (plainTableData.id && plainTableData.updateData) {
      updatedTable = await Table.findOneAndUpdate(
        { id: plainTableData.id },
        { $set: plainTableData.updateData },
        { new: true, runValidators: true }
      );
    }
    // If tableData is the full table object
    else {
      updatedTable = await Table.findOneAndUpdate(
        { id: plainTableData.id },
        { $set: plainTableData },
        { new: true, runValidators: true }
      );
    }

    if (!updatedTable) {
      console.log("Table not found.");
      return null;
    }

    // Convert Mongoose document to plain object
    return JSON.parse(JSON.stringify(updatedTable.toObject()));
  } catch (error) {
    console.error("Error updating table:", error);
    throw error;
  }
}

export async function getAllTables() {
  const allTables = await Table.find({}).lean().exec();
  // Convert to plain objects and ensure createdAt is properly formatted
  return allTables.map(table => {
    const plainTable = JSON.parse(JSON.stringify(table));
    return {
      ...plainTable,
      createdAt: plainTable.createdAt ? new Date(plainTable.createdAt).toISOString() : new Date().toISOString()
    };
  });
}

export async function getTable(filename) {
  const allTables = await Table.find({ fileName: filename }).lean().exec();
  return allTables.map(table => JSON.parse(JSON.stringify(table)));
}

// const files = await fs.readdir("./public/uploads");

// const htmlTables = files
//   .filter((file) => file.endsWith(".html") || file.endsWith(".htm"))
//   .map((file) => `/uploads/${file}`);

// var contents = await Promise.all(htmlTables.map( async filenames => {
//     return (await fs.readFile(`./public${htmlTables[0]}`)).toString()
// }))
