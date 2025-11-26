import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Schemas
const commentSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  text: { type: String, required: true },
  author: { type: String, default: "Anônimo" },
  created_at: { type: Date, default: Date.now },
});

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ["image", "video"], required: true },
  position: { type: Number, default: 0 },
  comments: [commentSchema],
  created_at: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  media: [mediaSchema],
  created_at: { type: Date, default: Date.now },
});

// Models
// Use mongoose.models to prevent overwriting models during hot reload
export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default connectDB;
