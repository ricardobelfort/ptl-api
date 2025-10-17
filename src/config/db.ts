import mongoose from 'mongoose';
import { env } from '@/config/env';

export async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  }
}
