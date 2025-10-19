import 'dotenv/config';
import { connectDB } from '@/config/db';
import { cleanupExpiredTokens } from '@/utils/jwt';
import { env } from '@/config/env';

async function runTokenCleanup() {
  try {
    await connectDB();
    
    console.log('🧹 Iniciando limpeza de tokens expirados...');
    
    const cleanedCount = await cleanupExpiredTokens();
    
    console.log(`✅ Limpeza concluída! ${cleanedCount} token(s) removido(s).`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    process.exit(1);
  }
}

// Executar limpeza
runTokenCleanup();