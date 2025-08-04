import mongoose from 'mongoose';
import LoggerColor from 'node-color-log';

export const connectToMongo = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    LoggerColor.bold().success('✅ MongoDB connected');
  } catch (error) {
    LoggerColor.bold().error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectFromMongo = async () => {
  try {
    await mongoose.disconnect();
    LoggerColor.bold().success('✅ MongoDB disconnected');
  } catch (error) {
    LoggerColor.bold().error('❌ MongoDB disconnection error:', error);
  }
};
