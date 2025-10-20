import request from 'supertest';
import app from '../app';
import { Interno } from '../modules/interno/interno.model';
import mongoose from 'mongoose';

// Usuários mockados para autenticação
const tokens = {
  gerente: '',
  diretor: '',
  adjunto: ''
};

import bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.model';
import { connectDB } from '../config/db';

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({ email: /@test.local$/ });
  const perfis = [
    { perfil: 'GERENTE DE PROJETO', email: 'gerente@test.local', nome: 'Gerente' },
    { perfil: 'DIRETOR', email: 'diretor@test.local', nome: 'Diretor' },
    { perfil: 'ADJUNTO', email: 'adjunto@test.local', nome: 'Adjunto' }
  ];
  const senha = 'Senha@123';
  const senhaHash = await bcrypt.hash(senha, 10);
  const perfilToTokenKey = {
    'GERENTE DE PROJETO': 'gerente',
    'DIRETOR': 'diretor',
    'ADJUNTO': 'adjunto'
  } as const;
  for (const { perfil, email, nome } of perfis) {
    await User.create({ email, nome, senhaHash, perfil, ativo: true });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: senha });
    const key = perfilToTokenKey[perfil as keyof typeof perfilToTokenKey];
    tokens[key] = res.body.access_token;
  }
  await Interno.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Internos API', () => {
  it('Gerente pode criar novo interno', async () => {
    const res = await request(app)
      .post('/api/v1/internos')
      .set('Authorization', `Bearer ${tokens.gerente}`)
      .send({
        nome: 'João da Silva',
        funcao: 'Cozinheiro',
        status: 'remunerado',
        dataAdmissao: new Date().toISOString(),
        unidade: 'Unidade A'
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('nome', 'João da Silva');
  });

  it('Diretor NÃO pode criar interno', async () => {
    const res = await request(app)
      .post('/api/v1/internos')
      .set('Authorization', `Bearer ${tokens.diretor}`)
      .send({
        nome: 'Maria',
        funcao: 'Limpeza',
        status: 'remunerado',
        dataAdmissao: new Date().toISOString(),
        unidade: 'Unidade B'
      });
    expect(res.status).toBe(403);
  });

  it('Gerente pode atualizar/desligar interno', async () => {
    const interno = await Interno.create({
      nome: 'Carlos',
      funcao: 'Jardineiro',
      status: 'remunerado',
      dataAdmissao: new Date(),
      unidade: 'Unidade C'
    });
    const res = await request(app)
      .put(`/api/v1/internos/${interno._id}`)
      .set('Authorization', `Bearer ${tokens.gerente}`)
      .send({
        dataDesligamento: new Date().toISOString(),
        motivoDesligamento: 'Fim de contrato'
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dataDesligamento');
    expect(res.body).toHaveProperty('motivoDesligamento', 'Fim de contrato');
  });

  it('Diretor NÃO pode atualizar interno', async () => {
    const interno = await Interno.create({
      nome: 'Ana',
      funcao: 'Auxiliar',
      status: 'remunerado',
      dataAdmissao: new Date(),
      unidade: 'Unidade D'
    });
    const res = await request(app)
      .put(`/api/v1/internos/${interno._id}`)
      .set('Authorization', `Bearer ${tokens.diretor}`)
      .send({
        motivoDesligamento: 'Outro motivo'
      });
    expect(res.status).toBe(403);
  });

  it('Todos perfis podem listar internos', async () => {
    const perfis = ['gerente', 'diretor', 'adjunto'] as const;
    for (const perfil of perfis) {
      const res = await request(app)
        .get('/api/v1/internos')
        .set('Authorization', `Bearer ${tokens[perfil]}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    }
  });
});
