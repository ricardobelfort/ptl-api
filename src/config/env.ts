import 'dotenv/config';

const required = (name: string, def?: string) => {
  const v = process.env[name] ?? def;
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  MONGODB_URI: required('MONGODB_URI', 'mongodb://localhost:27017/painel'),
  JWT_SECRET: required('JWT_SECRET', 'dev-secret-change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS ?? '7', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '500', 10),
  // Configurações de limpeza automática
  CLEANUP_EXPIRED_TOKENS_INTERVAL_HOURS: parseInt(process.env.CLEANUP_EXPIRED_TOKENS_INTERVAL_HOURS ?? '24', 10)
};
