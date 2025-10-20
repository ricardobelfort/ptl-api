import 'dotenv/config';
import { connectDB } from '@/config/db';
import { User } from '@/modules/users/user.model';

async function checkAdminUser() {
  await connectDB();
  
  console.log('🔍 Verificando usuário admin...\n');
  
  const admin = await User.findOne({ perfil: 'ADMIN' }).lean();
  
  if (admin) {
    console.log('👤 Usuário admin encontrado:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Nome: ${admin.nome}`);
    console.log(`  Perfil: ${admin.perfil}`);
    console.log(`  Ativo: ${admin.ativo}`);
    console.log(`  ID: ${admin._id}`);
  } else {
    console.log('❌ Usuário admin não encontrado');
  }
  
  process.exit(0);
}

checkAdminUser().catch(console.error);