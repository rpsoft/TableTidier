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
  tid: {
    type: Number,
    required: false,
  },
});

export const Table = mongoose
  .createConnection(process.env.MONGODB_URI)
  .model("Tables", tableSchema);

// module.exports = { Table };
