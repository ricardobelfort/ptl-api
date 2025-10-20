import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/config/db';
import { User } from '@/modules/users/user.model';

async function run() {
  await connectDB();
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@ptl.gov';
  const senha = process.env.SEED_ADMIN_PASS ?? 'Senha@123';
  const hash = await bcrypt.hash(senha, 10);

  const up = await User.findOneAndUpdate(
    { email },
    { email, nome: 'Admin PTL', senhaHash: hash, perfil: 'ADMIN', ativo: true },
    { upsert: true, new: true }
  );

  console.log('✅ Admin seed ok:', { email, senha });
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
