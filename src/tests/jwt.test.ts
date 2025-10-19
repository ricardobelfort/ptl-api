import { 
  signAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  verifyAccessToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  addTokenToBlacklist,
  isTokenBlacklisted 
} from '../utils/jwt';
import { RefreshToken } from '../modules/auth/refresh-token.model';
import { User } from '../modules/users/user.model';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';

describe('JWT Utils', () => {
  let testUserId: string;

  beforeAll(async () => {
    await connectDB();
    
    // Criar usuário de teste
    const testUser = await User.create({
      email: 'test@jwt.local',
      nome: 'Test User',
      senhaHash: 'hashedpassword',
      perfil: 'admin',
      ativo: true
    });
    testUserId = String(testUser._id);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await RefreshToken.deleteMany({});
    await User.deleteMany({ email: 'test@jwt.local' });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpar refresh tokens antes de cada teste
    await RefreshToken.deleteMany({});
  });

  describe('Access Token', () => {
    it('should generate a valid access token', () => {
      const payload = {
        sub: testUserId,
        perfil: 'admin' as const,
        unidadeCodigo: 'TEST-001',
        regioes: ['TESTE']
      };

      const token = signAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should verify a valid access token', () => {
      const payload = {
        sub: testUserId,
        perfil: 'admin' as const,
        unidadeCodigo: 'TEST-001'
      };

      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.sub).toBe(testUserId);
      expect(decoded!.perfil).toBe('admin');
      expect(decoded!.tokenType).toBe('access');
    });

    it('should return null for invalid access token', () => {
      const decoded = verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for blacklisted token', () => {
      const payload = {
        sub: testUserId,
        perfil: 'admin' as const
      };

      const token = signAccessToken(payload);
      addTokenToBlacklist(token);

      expect(isTokenBlacklisted(token)).toBe(true);
      expect(verifyAccessToken(token)).toBeNull();
    });
  });

  describe('Refresh Token', () => {
    it('should generate a valid refresh token', async () => {
      const refreshToken = await generateRefreshToken({
        userId: testUserId,
        deviceInfo: {
          userAgent: 'Test Agent',
          ip: '127.0.0.1'
        }
      });

      expect(refreshToken).toBeDefined();
      expect(refreshToken.token).toBeDefined();
      expect(String(refreshToken.userId)).toBe(testUserId);
      expect(refreshToken.isRevoked).toBe(false);
      expect(refreshToken.isValid()).toBe(true);
    });

    it('should verify a valid refresh token', async () => {
      const refreshToken = await generateRefreshToken({
        userId: testUserId
      });

      const verified = await verifyRefreshToken(refreshToken.token);
      expect(verified).toBeDefined();
      expect(String(verified!.userId)).toBe(testUserId);
      expect(verified!.isValid()).toBe(true);
    });

    it('should return null for invalid refresh token', async () => {
      const verified = await verifyRefreshToken('invalid-refresh-token');
      expect(verified).toBeNull();
    });

    it('should return null for revoked refresh token', async () => {
      const refreshToken = await generateRefreshToken({
        userId: testUserId
      });

      await refreshToken.revoke();
      
      const verified = await verifyRefreshToken(refreshToken.token);
      expect(verified).toBeNull();
    });

    it('should return null for expired refresh token', async () => {
      const refreshToken = await RefreshToken.create({
        token: 'expired-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 1000), // Já expirado
        deviceInfo: {}
      });

      const verified = await verifyRefreshToken(refreshToken.token);
      expect(verified).toBeNull();
    });
  });

  describe('Token Revocation', () => {
    it('should revoke a specific refresh token', async () => {
      const refreshToken = await generateRefreshToken({
        userId: testUserId
      });

      const revoked = await revokeRefreshToken(refreshToken.token);
      expect(revoked).toBe(true);

      const verified = await verifyRefreshToken(refreshToken.token);
      expect(verified).toBeNull();
    });

    it('should return false when trying to revoke non-existent token', async () => {
      const revoked = await revokeRefreshToken('non-existent-token');
      expect(revoked).toBe(false);
    });

    it('should revoke all refresh tokens for a user', async () => {
      // Criar múltiplos refresh tokens
      await generateRefreshToken({ userId: testUserId });
      await generateRefreshToken({ userId: testUserId });
      await generateRefreshToken({ userId: testUserId });

      const revokedCount = await revokeAllUserRefreshTokens(testUserId);
      expect(revokedCount).toBe(3);

      // Verificar se todos foram revogados
      const activeTokens = await RefreshToken.find({ 
        userId: testUserId, 
        isRevoked: false 
      });
      expect(activeTokens).toHaveLength(0);
    });
  });

  describe('Token Blacklist', () => {
    it('should add token to blacklist', () => {
      const token = 'test-token-123';
      addTokenToBlacklist(token);
      
      expect(isTokenBlacklisted(token)).toBe(true);
    });

    it('should check if token is blacklisted', () => {
      const token = 'test-token-456';
      
      expect(isTokenBlacklisted(token)).toBe(false);
      
      addTokenToBlacklist(token);
      expect(isTokenBlacklisted(token)).toBe(true);
    });
  });
});