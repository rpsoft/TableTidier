import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const projectUserSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'reviewer', 'screener', 'extractor', 'viewer'],
    required: true,
  },
  assignedBy: {
    type: String,
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Ensure unique combination of project and user
projectUserSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const ProjectUser = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("ProjectUsers", projectUserSchema);
