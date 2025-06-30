import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// String
// Number
// Date
// Buffer
// Boolean
// Mixed
// ObjectId
// Array
// Decimal128
// Map
// Schema
// UUID
// BigInt

const tableSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
    // validate: {
    //     validator: function (v) {
    //         return v.length > 0;
    //     },
    //     message: (props) => `${props.value} is not a valid cohort!`,
    // },
  },
  documentId: {
    type: String,
    required: true,
  },
  collectionId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  tid: {
    type: Number,
    required: false,
  },
  annotationData: {
    type: Object,
  },
});

// Use the default mongoose connection instead of creating a new one
export const Table = mongoose.models.Tables || mongoose.model("Tables", tableSchema);

// module.exports = { Table };
