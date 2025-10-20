import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.model';
import { env } from '../config/env';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  const senha = 'Senha@123';
  const senhaHash = await bcrypt.hash(senha, 10);
  const users = [
    { perfil: 'GERENTE DE PROJETO', email: 'gerente@test.local', nome: 'Gerente', senhaHash },
    { perfil: 'DIRETOR', email: 'diretor@test.local', nome: 'Diretor', senhaHash },
    { perfil: 'ADJUNTO', email: 'adjunto@test.local', nome: 'Adjunto', senhaHash }
  ];
  for (const user of users) {
    await User.findOneAndUpdate(
      { email: user.email },
      { ...user, ativo: true },
      { upsert: true, new: true }
    );
    console.log(`Usuário ${user.email} (${user.perfil}) criado/atualizado.`);
  }
  await mongoose.disconnect();
  console.log('Seed finalizado.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
