import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Declara o servidor em memória
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Espera a conexão antes de prosseguir
  await mongoose.connect(uri, {
    dbName: 'test',
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
