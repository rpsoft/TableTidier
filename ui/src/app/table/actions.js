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

export async function updateTable(id, updateData) {
  try {

   const updatedTable = await Table.findOneAndUpdate(
      { id }, // Find the document by id
      { $set: updateData }, // Apply updates
      { new: true, runValidators: true }, // Return updated doc, validate schema
    );

    if (!updatedTable) {
      console.log("Table not found.");
      return null;
    }

    console.log("Table updated:", updatedTable);
    return updatedTable;
  } catch (error) {
    console.error("Error updating table:", error);
  }
  // finally {
  //   mongoose.connection.close();
  // }

  revalidatePath("/");
}

export async function getAllTables() {
  const allTables = await Table.find({}).lean().exec();

  return JSON.parse(JSON.stringify(allTables));
}

export async function getTable(filename) {
  const allTables = await Table.find({ fileName: filename }).lean().exec();

  return JSON.parse(JSON.stringify(allTables));
}

// const files = await fs.readdir("./public/uploads");

// const htmlTables = files
//   .filter((file) => file.endsWith(".html") || file.endsWith(".htm"))
//   .map((file) => `/uploads/${file}`);

// var contents = await Promise.all(htmlTables.map( async filenames => {
//     return (await fs.readFile(`./public${htmlTables[0]}`)).toString()
// }))
