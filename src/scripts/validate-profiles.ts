import 'dotenv/config';
import { connectDB } from '@/config/db';
import { User } from '@/modules/users/user.model';

const PERFIS_VALIDOS = ['ADMIN', 'DIRETOR', 'ADJUNTO', 'GERENTE DE PROJETO'];

async function validateAndFixProfiles() {
  await connectDB();
  
  console.log('🔍 Verificando perfis inválidos...\n');
  
  // Buscar usuários com perfis inválidos
  const usuariosInvalidos = await User.find({ 
    perfil: { $nin: PERFIS_VALIDOS } 
  }).lean();
  
  if (usuariosInvalidos.length === 0) {
    console.log('✅ Todos os usuários têm perfis válidos.');
    
    // Mostrar estatísticas
    const stats = await User.aggregate([
      { $group: { _id: '$perfil', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Distribuição atual de perfis:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} usuário(s)`);
    });
    
    process.exit(0);
  }
  
  console.log(`❌ Encontrados ${usuariosInvalidos.length} usuário(s) com perfis inválidos:`);
  usuariosInvalidos.forEach(user => {
    console.log(`  - ${user.email}: "${user.perfil}" (inválido)`);
  });
  
  console.log('\n🔧 Perfis válidos disponíveis:');
  PERFIS_VALIDOS.forEach(perfil => {
    console.log(`  - ${perfil}`);
  });
  
  console.log('\n⚠️  Usuários com perfis inválidos precisam ser corrigidos manualmente.');
  console.log('💡 Use o MongoDB Compass ou scripts específicos para atualizar os perfis.');
  
  process.exit(1);
}

validateAndFixProfiles().catch(console.error);