import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const collectionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: {
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
});

export const Collection = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("Collections", collectionSchema); 