import 'dotenv/config';
import { connectDB } from '@/config/db';
import { AccessLog } from '@/modules/logs/access-log.model';
import { User } from '@/modules/users/user.model';

async function seedAccessLogs() {
  await connectDB();
  
  console.log('🌱 Criando logs de acesso de exemplo...\n');
  
  // Buscar o usuário admin
  const admin = await User.findOne({ perfil: 'admin' }).lean();
  if (!admin) {
    console.log('❌ Usuário admin não encontrado. Execute npm run seed:admin primeiro.');
    process.exit(1);
  }
  
  // Criar logs de exemplo
  const sampleLogs = [
    {
      userId: admin._id,
      email: admin.email,
      nome: admin.nome,
      perfil: admin.perfil,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      method: 'POST',
      path: '/api/v1/auth/login',
      statusCode: 200,
      responseTime: 150,
      success: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // ontem
    },
    {
      userId: admin._id,
      email: admin.email,
      nome: admin.nome,
      perfil: admin.perfil,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      method: 'GET',
      path: '/api/v1/indicadores/kpis',
      statusCode: 200,
      responseTime: 89,
      success: true,
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) // ontem
    },
    {
      userId: admin._id,
      email: admin.email,
      nome: admin.nome,
      perfil: admin.perfil,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      method: 'POST',
      path: '/api/v1/uploads',
      statusCode: 400,
      responseTime: 45,
      success: false,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12h atrás
    },
    {
      userId: admin._id,
      email: admin.email,
      nome: admin.nome,
      perfil: admin.perfil,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      method: 'GET',
      path: '/api/v1/logs/access',
      statusCode: 200,
      responseTime: 234,
      success: true,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1h atrás
    },
    {
      userId: admin._id,
      email: admin.email,
      nome: admin.nome,
      perfil: admin.perfil,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      method: 'GET',
      path: '/api/v1/logs/access/stats',
      statusCode: 200,
      responseTime: 156,
      success: true,
      timestamp: new Date() // agora
    }
  ];
  
  await AccessLog.insertMany(sampleLogs);
  
  console.log(`✅ Criados ${sampleLogs.length} logs de acesso de exemplo!`);
  console.log('\n📊 Logs criados:');
  sampleLogs.forEach((log, index) => {
    console.log(`  ${index + 1}. ${log.method} ${log.path} (${log.statusCode}) - ${log.timestamp.toLocaleString()}`);
  });
  
  console.log('\n🔗 Agora você pode testar os endpoints:');
  console.log('  GET /api/v1/logs/access');
  console.log('  GET /api/v1/logs/access/stats');
  
  process.exit(0);
}

seedAccessLogs().catch(console.error);