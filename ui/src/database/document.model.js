import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const documentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalContent: {
    type: String,
    required: true,
  },
  metadata: {
    title: String,
    authors: [String],
    journal: String,
    year: Number,
    doi: String,
    abstract: String,
    keywords: [String],
  },
  // Parsed document structure
  text: [{
    section: String, // 'abstract', 'methods', 'results', 'discussion', etc.
    content: String,
    highlights: [{
      spanStart: Number,
      spanEnd: Number,
      label: String,
      userId: String,
      timestamp: { type: Date, default: Date.now },
    }],
  }],
  // Tables within the document
  tables: [{
    id: String,
    headers: [[String]], // 2D array for multi-row headers
    rows: [[String]],
    annotations: {
      columns: mongoose.Schema.Types.Mixed, // { "0": "intervention", "1": "outcome" }
      rows: mongoose.Schema.Types.Mixed,
    },
    htmlContent: String, // Original HTML for editing
  }],
  // Screening decisions
  screening: [{
    userId: String,
    decision: {
      type: String,
      enum: ['included', 'excluded', 'pending'],
    },
    reason: String,
    timestamp: { type: Date, default: Date.now },
  }],
  // Extracted data
  extractedData: [{
    variable: String,
    value: String,
    source: {
      docId: String,
      tableId: String,
      cell: [Number], // [row, col]
      textSpan: {
        start: Number,
        end: Number,
      },
    },
    extractedBy: String,
    ontologyMatch: {
      umlsId: String,
      conceptName: String,
    },
    timestamp: { type: Date, default: Date.now },
  }],
  // Document status
  status: {
    type: String,
    enum: ['uploaded', 'parsed', 'screened', 'extracted', 'completed'],
    default: 'uploaded',
  },
  uploadedBy: {
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

export const Document = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("Documents", documentSchema);
