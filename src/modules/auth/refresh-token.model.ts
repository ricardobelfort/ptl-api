import { Schema, model, Document, Model } from 'mongoose';

const RefreshTokenSchema = new Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'usuarios', 
    required: true, 
    index: true 
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: { expireAfterSeconds: 0 } // MongoDB TTL - remove automaticamente
  },
  isRevoked: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  deviceInfo: {
    userAgent: { type: String },
    ip: { type: String },
    deviceName: { type: String }
  },
  lastUsed: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  collection: 'refresh_tokens'
});

// Índices compostos para performance
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ token: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 });

// Método para verificar se o token está válido
RefreshTokenSchema.methods.isValid = function(): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Método para revogar o token
RefreshTokenSchema.methods.revoke = async function(): Promise<void> {
  this.isRevoked = true;
  await this.save();
};

// Método estático para cleanup de tokens expirados
RefreshTokenSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true }
    ]
  });
  return result.deletedCount;
};

// Método estático para revogar todos os tokens de um usuário
RefreshTokenSchema.statics.revokeAllForUser = async function(userId: string): Promise<number> {
  const result = await this.updateMany(
    { userId, isRevoked: false },
    { 
      isRevoked: true, 
      updatedAt: new Date() 
    }
  );
  return result.modifiedCount;
};

export interface RefreshTokenDoc extends Document {
  token: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    deviceName?: string;
  };
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
  isValid(): boolean;
  revoke(): Promise<void>;
}

export interface RefreshTokenModel extends Model<RefreshTokenDoc> {
  cleanupExpired(): Promise<number>;
  revokeAllForUser(userId: string): Promise<number>;
}

export const RefreshToken = model<RefreshTokenDoc, RefreshTokenModel>('refresh_tokens', RefreshTokenSchema);