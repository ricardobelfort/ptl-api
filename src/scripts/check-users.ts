import 'dotenv/config';
import { connectDB } from '@/config/db';
import { User } from '@/modules/users/user.model';

async function checkUsers() {
  await connectDB();
  
  console.log('🔍 Verificando usuários existentes...\n');
  
  // Buscar todos os usuários
  const allUsers = await User.find({}).lean();
  console.log(`Total de usuários: ${allUsers.length}`);
  
  // Contar por perfil
  const perfilCount: Record<string, number> = {};
  allUsers.forEach(user => {
    perfilCount[user.perfil] = (perfilCount[user.perfil] || 0) + 1;
  });
  
  console.log('\n📊 Distribuição por perfil:');
  Object.entries(perfilCount).forEach(([perfil, count]) => {
    console.log(`  ${perfil}: ${count} usuário(s)`);
  });
  
  // Verificar se existem perfis que precisam ser migrados
  const perfisAntigos = ['gestor_regional', 'gestor_unidade', 'auditor'];
  const usuariosParaMigrar = allUsers.filter(user => perfisAntigos.includes(user.perfil));
  
  if (usuariosParaMigrar.length > 0) {
    console.log(`\n⚠️  Encontrados ${usuariosParaMigrar.length} usuário(s) com perfis antigos:`);
    usuariosParaMigrar.forEach(user => {
      console.log(`  - ${user.email} (${user.perfil})`);
    });
    console.log('\n✨ Execute o script de migração para atualizar estes perfis.');
  } else {
    console.log('\n✅ Todos os usuários já estão com perfis válidos.');
  }
  
  process.exit(0);
}

checkUsers().catch(console.error);