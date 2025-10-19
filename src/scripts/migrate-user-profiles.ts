import 'dotenv/config';
import { connectDB } from '@/config/db';
import { User } from '@/modules/users/user.model';

// Mapeamento dos perfis antigos para os novos
const MAPEAMENTO_PERFIS: Record<string, string> = {
  'gestor_regional': 'DIRETOR',
  'gestor_unidade': 'GERENTE DE PROJETO', 
  'auditor': 'ADJUNTO'
};

async function migrateUsers() {
  await connectDB();
  
  console.log('🚀 Iniciando migração de perfis de usuário...\n');
  
  // Buscar usuários com perfis antigos
  const perfisAntigos = Object.keys(MAPEAMENTO_PERFIS);
  const usuariosParaMigrar = await User.find({ 
    perfil: { $in: perfisAntigos } 
  }).lean();
  
  if (usuariosParaMigrar.length === 0) {
    console.log('✅ Nenhum usuário precisa ser migrado.');
    process.exit(0);
  }
  
  console.log(`📋 Encontrados ${usuariosParaMigrar.length} usuário(s) para migrar:`);
  usuariosParaMigrar.forEach(user => {
    const novoPerfil = MAPEAMENTO_PERFIS[user.perfil];
    console.log(`  - ${user.email}: ${user.perfil} → ${novoPerfil}`);
  });
  
  // Confirmar antes de prosseguir
  console.log('\n⚠️  Esta operação irá atualizar os perfis no banco de dados.');
  console.log('💡 Certifique-se de ter um backup antes de continuar.\n');
  
  // Executar a migração
  const migracoes = usuariosParaMigrar.map(async (user) => {
    const novoPerfil = MAPEAMENTO_PERFIS[user.perfil];
    return User.findByIdAndUpdate(
      user._id,
      { perfil: novoPerfil },
      { new: true }
    );
  });
  
  try {
    const resultados = await Promise.all(migracoes);
    
    console.log('✅ Migração concluída com sucesso!');
    console.log(`📊 ${resultados.length} usuário(s) atualizado(s):\n`);
    
    resultados.forEach(user => {
      if (user) {
        console.log(`  ✓ ${user.email} → ${user.perfil}`);
      }
    });
    
    // Verificar se ainda existem perfis antigos
    const usuariosRestantes = await User.find({ 
      perfil: { $in: perfisAntigos } 
    }).countDocuments();
    
    if (usuariosRestantes === 0) {
      console.log('\n🎉 Todos os usuários foram migrados com sucesso!');
    } else {
      console.log(`\n⚠️  Ainda existem ${usuariosRestantes} usuário(s) com perfis antigos.`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateUsers().catch(console.error);