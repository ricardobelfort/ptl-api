import { RefreshToken } from '../modules/auth/refresh-token.model';
import { User } from '../modules/users/user.model';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';

describe('RefreshToken Model', () => {
  let testUserId: string;

  beforeAll(async () => {
    await connectDB();
    
    // Criar usuário de teste
    const testUser = await User.create({
      email: 'test@model.local',
      nome: 'Test User',
      senhaHash: 'hashedpassword',
      perfil: 'ADMIN',
      ativo: true
    });
    testUserId = String(testUser._id);
  });

  afterAll(async () => {
    await RefreshToken.deleteMany({});
    await User.deleteMany({ email: 'test@model.local' });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await RefreshToken.deleteMany({});
  });

  describe('Token Creation', () => {
    it('should create a valid refresh token', async () => {
      const refreshToken = await RefreshToken.create({
        token: 'test-token-123',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        deviceInfo: {
          userAgent: 'Test Agent',
          ip: '127.0.0.1',
          deviceName: 'Test Device'
        }
      });

      expect(refreshToken).toBeDefined();
      expect(refreshToken.token).toBe('test-token-123');
      expect(String(refreshToken.userId)).toBe(testUserId);
      expect(refreshToken.isRevoked).toBe(false);
      expect(refreshToken.deviceInfo.userAgent).toBe('Test Agent');
    });

    it('should enforce unique token constraint', async () => {
      await RefreshToken.create({
        token: 'duplicate-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await expect(RefreshToken.create({
        token: 'duplicate-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })).rejects.toThrow();
    });
  });

  describe('Token Validation', () => {
    it('should validate active token', async () => {
      const refreshToken = await RefreshToken.create({
        token: 'valid-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias no futuro
      });

      expect(refreshToken.isValid()).toBe(true);
    });

    it('should invalidate revoked token', async () => {
      const refreshToken = await RefreshToken.create({
        token: 'revoked-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: true
      });

      expect(refreshToken.isValid()).toBe(false);
    });

    it('should invalidate expired token', async () => {
      const refreshToken = await RefreshToken.create({
        token: 'expired-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 1000) // 1 segundo no passado
      });

      expect(refreshToken.isValid()).toBe(false);
    });
  });

  describe('Token Revocation', () => {
    it('should revoke token', async () => {
      const refreshToken = await RefreshToken.create({
        token: 'token-to-revoke',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(refreshToken.isRevoked).toBe(false);
      
      await refreshToken.revoke();
      
      expect(refreshToken.isRevoked).toBe(true);
      expect(refreshToken.isValid()).toBe(false);
    });

    it('should revoke all tokens for user', async () => {
      // Criar múltiplos tokens para o usuário
      await RefreshToken.create({
        token: 'token-1',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await RefreshToken.create({
        token: 'token-2',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await RefreshToken.create({
        token: 'token-3',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const revokedCount = await RefreshToken.revokeAllForUser(testUserId);
      expect(revokedCount).toBe(3);

      // Verificar se todos foram revogados
      const activeTokens = await RefreshToken.find({ 
        userId: testUserId, 
        isRevoked: false 
      });
      expect(activeTokens).toHaveLength(0);
    });
  });

  describe('Token Cleanup', () => {
    it('should cleanup expired tokens', async () => {
      // Criar tokens expirados
      await RefreshToken.create({
        token: 'expired-1',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 1000),
        isRevoked: false
      });

      await RefreshToken.create({
        token: 'expired-2',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 2000),
        isRevoked: true
      });

      // Criar token válido
      await RefreshToken.create({
        token: 'valid-1',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false
      });

      const cleanedCount = await RefreshToken.cleanupExpired();
      expect(cleanedCount).toBe(2);

      // Verificar se apenas o token válido permanece
      const remainingTokens = await RefreshToken.find({});
      expect(remainingTokens).toHaveLength(1);
      expect(remainingTokens[0].token).toBe('valid-1');
    });
  });

  describe('Indexes and Performance', () => {
    it('should have proper indexes', async () => {
      const indexes = await RefreshToken.collection.getIndexes();
      
      // Verificar se os índices esperados existem
      const indexNames = Object.keys(indexes);
      expect(indexNames).toContain('token_1');
      expect(indexNames).toContain('userId_1');
    });
  });
});