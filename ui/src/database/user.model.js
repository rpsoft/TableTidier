import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  departmentIds: [String], // Users can belong to multiple departments
  roles: [{
    type: String,
    enum: ['admin', 'reviewer', 'screener', 'extractor', 'viewer'],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

export const User = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("Users", userSchema);
