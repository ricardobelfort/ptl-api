import request from 'supertest';
import app from '../app';
import { User } from '../modules/users/user.model';
import { RefreshToken } from '../modules/auth/refresh-token.model';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {
  let testUser: any;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await RefreshToken.deleteMany({});
    await User.deleteMany({ email: 'test@auth.local' });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await RefreshToken.deleteMany({});
    await User.deleteMany({ email: 'test@auth.local' });

    // Criar usuário de teste
    const senhaHash = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      email: 'test@auth.local',
      nome: 'Test User',
      senhaHash,
      perfil: 'ADMIN',
      ativo: true
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('token_type', 'Bearer');
      expect(response.body).toHaveProperty('perfil', 'ADMIN');
      expect(response.body).toHaveProperty('nome', 'Test User');

      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@auth.local',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should reject inactive user', async () => {
      await User.updateOne({ email: 'test@auth.local' }, { ativo: false });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: '123' // muito curta
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      // Fazer login para obter tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      accessToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should refresh access token with valid refresh token', async () => {
      // Aguardar 1 segundo para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.access_token).not.toBe(accessToken); // Novo token
      expect(response.body.refresh_token).not.toBe(refreshToken); // Token rotacionado
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid-refresh-token'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Refresh token inválido ou expirado');
    });

    it('should reject already used refresh token', async () => {
      // Usar o refresh token uma vez
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken
        });

      // Tentar usar novamente
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Refresh token inválido ou expirado');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      accessToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should logout with valid tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout realizado com sucesso');
      expect(response.body).toHaveProperty('revoked', true);
    });

    it('should reject logout without access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refresh_token: refreshToken
        });

      expect(response.status).toBe(401);
    });

    it('should reject logout with revoked access token', async () => {
      // Fazer logout primeiro
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: refreshToken
        });

      // Tentar usar o token novamente
      const response = await request(app)
        .get('/api/v1/logs/access')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      accessToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should logout all devices', async () => {
      // Criar múltiplos refresh tokens (simulando múltiplos logins)
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@auth.local',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout global realizado com sucesso');
      expect(response.body).toHaveProperty('revoked_tokens');
      expect(response.body.revoked_tokens).toBeGreaterThan(0);
    });

    it('should reject logout-all without access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout-all');

      expect(response.status).toBe(401);
    });
  });
});