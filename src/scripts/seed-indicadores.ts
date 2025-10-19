import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import { User } from '@/modules/users/user.model';
import { IndicadorMensal } from '@/modules/indicadores/indicador-mensal.model';

async function runSeed() {
  console.log('🌱 Iniciando seed do banco...');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Conectado ao MongoDB');

  await mongoose.connect(env.MONGODB_URI);
  console.log('🔌 Conectado em:', mongoose.connection.name);

  // limpa as coleções
  await Promise.all([
    User.deleteMany({}),
    IndicadorMensal.deleteMany({})
  ]);

  // cria usuário admin
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    email: 'admin@ptl.local',
    nome: 'Administrador Geral',
    senhaHash,
    perfil: 'admin',
    ativo: true
  });

  console.log(`👤 Usuário admin criado: ${admin.email} (senha: admin123)`);

  // cria indicadores simulados
  const unidades = ['PEF-001', 'PEF-002', 'PEF-003'];
  const competencias = ['2025-07', '2025-08', '2025-09', '2025-10'];

  const docs: any[] = [];

  for (const unidade of unidades) {
    for (const competencia of competencias) {
      const populacao = 500 + Math.floor(Math.random() * 300);
      const trabalhando = Math.floor(populacao * (0.25 + Math.random() * 0.3));
      const taxa = Number(((trabalhando / populacao) * 100).toFixed(1));

      docs.push({
        competencia,
        unidadeCodigo: unidade,
        populacaoTotal: populacao,
        internosTrabalhando: trabalhando,
        taxaTrabalho: taxa,
        distribuicaoPorAtividade: [
          { atividadeCodigo: 'AT-COZ', internos: Math.floor(trabalhando * 0.3) },
          { atividadeCodigo: 'AT-LIMP', internos: Math.floor(trabalhando * 0.4) },
          { atividadeCodigo: 'AT-CONF', internos: Math.floor(trabalhando * 0.3) }
        ],
        createdAt: new Date()
      });
    }
  }

  await IndicadorMensal.insertMany(docs);
  console.log(`📊 Inseridos ${docs.length} registros de indicadores.`);

  await mongoose.disconnect();
  console.log('✅ Seed finalizado e conexão encerrada.');
}

runSeed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
