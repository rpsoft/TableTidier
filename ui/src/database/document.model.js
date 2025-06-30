import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const documentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  collectionId: {
    type: String,
    required: true,
  },
  userId: {
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
  description: {
    type: String,
    default: '',
  },
  tableCount: {
    type: Number,
    default: 0,
  },
});

// Use the default mongoose connection instead of creating a new one
export const Document = mongoose.models.Documents || mongoose.model("Documents", documentSchema); 