import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const auditLogSchema = new mongoose.Schema({
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
  action: {
    type: String,
    required: true,
    enum: [
      'project_created',
      'project_updated',
      'document_uploaded',
      'document_acquired',
      'document_screened',
      'data_extracted',
      'annotation_created',
      'annotation_updated',
      'user_assigned',
      'role_changed',
      'conflict_resolved',
      'api_search_performed',
      'api_key_configured',
      'settings_updated',
    ],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: String,
  userAgent: String,
});

export const AuditLog = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("AuditLogs", auditLogSchema);
