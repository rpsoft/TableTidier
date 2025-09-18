import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const departmentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  userIds: [String], // Users belonging to this department
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Department = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("Departments", departmentSchema);
