import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  } as any);
  mongoose.set('strictQuery', true);
  return mongoose.connection;
}
