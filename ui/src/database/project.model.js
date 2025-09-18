import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const projectSchema = new mongoose.Schema({
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
  researchQuestion: {
    type: String,
    required: false,
  },
  criteria: {
    inclusion: [String],
    exclusion: [String],
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft',
  },
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
  // Project-level schema for data extraction
  dataSchema: {
    variables: [{
      name: String,
      type: String, // 'text', 'number', 'date', 'categorical'
      description: String,
      required: Boolean,
      options: [String], // for categorical variables
    }],
  },
  // PRISMA flow diagram data
  prismaData: {
    identified: { type: Number, default: 0 },
    screened: { type: Number, default: 0 },
    assessed: { type: Number, default: 0 },
    included: { type: Number, default: 0 },
  },
});

export const Project = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("Projects", projectSchema);
