import { Schema, model } from 'mongoose';

const IndicadorSchema = new Schema({
  competencia: { type: String, index: true }, // YYYY-MM
  unidadeCodigo: { type: String, index: true },
  populacaoTotal: Number,
  internosTrabalhando: Number,
  taxaTrabalho: Number,
  distribuicaoPorAtividade: [{ atividadeCodigo: String, internos: Number }],
  createdAt: { type: Date, default: () => new Date() }
});

IndicadorSchema.index({ unidadeCodigo: 1, competencia: 1 }, { unique: true });

export const Indicador = model('indicadores_mensais', IndicadorSchema);
