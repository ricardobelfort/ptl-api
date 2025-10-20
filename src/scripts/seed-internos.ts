import mongoose from 'mongoose';
import { Interno } from '../modules/interno/interno.model';
import { env } from '../config/env';

async function seedInternos() {
  await mongoose.connect(env.MONGODB_URI);
  await Interno.deleteMany({});
  const internos = [
    {
      nome: 'João da Silva',
      funcao: 'Cozinheiro',
      status: 'remunerado',
      dataAdmissao: new Date('2023-01-10'),
      unidade: 'Unidade A'
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Limpeza',
      status: 'remicao',
      dataAdmissao: new Date('2023-03-15'),
      unidade: 'Unidade B'
    },
    {
      nome: 'Carlos Souza',
      funcao: 'Jardineiro',
      status: 'remunerado',
      dataAdmissao: new Date('2023-05-20'),
      unidade: 'Unidade C'
    }
  ];
  await Interno.insertMany(internos);
  console.log('Internos criados com sucesso.');
  await mongoose.disconnect();
}

seedInternos().catch(e => {
  console.error(e);
  process.exit(1);
});
