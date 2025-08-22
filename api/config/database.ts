import mongoose from 'mongoose';

export async function connectDB() {
  try {
    console.log('Connecting to MongoDB', process.env.MONGODB_URI);
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://mongodb:27017/chesson';
    await mongoose.connect(mongoUrl);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}