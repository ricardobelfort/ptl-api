import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/config/db';
import { User } from '@/modules/users/user.model';

describe('POST /auth/login', () => {
  beforeAll(async () => {
    await connectDB(); // usa seu Mongo local/Atlas
    const hash = await bcrypt.hash('Senha@123', 10);
    await User.findOneAndUpdate(
      { email: 'admin@ptl.gov' },
      { email: 'admin@ptl.gov', nome: 'Admin', senhaHash: hash, perfil: 'ADMIN', ativo: true },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('deve autenticar e retornar token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ptl.gov', password: 'Senha@123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body.perfil).toBe('ADMIN');
  });

  it('deve falhar com senha errada', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ptl.gov', password: 'errada' });

    expect(res.status).toBe(401);
  });
});
