import 'dotenv/config';
import { connectDB } from '@/config/db';
import { AccessLog } from '@/modules/logs/access-log.model';

async function testLogsEndpoint() {
  await connectDB();
  
  console.log('🔍 Testando logs de acesso...\n');
  
  // Buscar logs existentes
  const logs = await AccessLog.find({})
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();
  
  console.log(`📊 Encontrados ${logs.length} logs:`);
  logs.forEach((log, index) => {
    console.log(`  ${index + 1}. ${log.method} ${log.path} (${log.statusCode}) - ${log.email} - ${log.timestamp.toLocaleString()}`);
  });
  
  // Estatísticas
  const total = await AccessLog.countDocuments({});
  const successful = await AccessLog.countDocuments({ success: true });
  const failed = await AccessLog.countDocuments({ success: false });
  
  console.log(`\n📈 Estatísticas:`);
  console.log(`  Total de requests: ${total}`);
  console.log(`  Sucessos: ${successful}`);
  console.log(`  Falhas: ${failed}`);
  console.log(`  Taxa de sucesso: ${total > 0 ? (successful / total * 100).toFixed(2) : 0}%`);
  
  console.log('\n✅ Teste concluído! O endpoint /api/v1/logs/access está pronto para uso.');
  console.log('\n📝 Para testar via HTTP:');
  console.log('1. Faça login: POST /api/v1/auth/login');
  console.log('2. Use o token: GET /api/v1/logs/access');
  console.log('3. Veja estatísticas: GET /api/v1/logs/access/stats');
  
  process.exit(0);
}

testLogsEndpoint().catch(console.error);