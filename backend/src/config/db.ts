import mongoose from 'mongoose';
import { logger } from '../utils/monitoring';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, {
      maxPoolSize: 50,  // Optimize based on workload
      minPoolSize: 10,  // Keep minimum connections open
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up event listeners for connection issues
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting to reconnect');
    });
    
  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
