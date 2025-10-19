import mongoose from 'mongoose';

const IndicadorMensalSchema = new mongoose.Schema({
  competencia: { type: String, index: true },
  unidadeCodigo: { type: String, index: true },
  populacaoTotal: Number,
  internosTrabalhando: Number,
  taxaTrabalho: Number,
  distribuicaoPorAtividade: [
    {
      atividadeCodigo: String,
      internos: Number
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export const IndicadorMensal = mongoose.model(
  'IndicadorMensal',
  IndicadorMensalSchema,
  'indicadores_mensais'
);
