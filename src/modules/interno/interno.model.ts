import { Schema, model, Document } from 'mongoose';

export interface InternoDoc extends Document {
  nome: string;
  funcao: string;
  status: 'remunerado' | 'remicao';
  dataAdmissao: Date;
  unidade: string;
  dataDesligamento?: Date;
  motivoDesligamento?: string;
}

const InternoSchema = new Schema<InternoDoc>({
  nome: { type: String, required: true },
  funcao: { type: String, required: true },
  status: { type: String, enum: ['remunerado', 'remicao'], required: true },
  dataAdmissao: { type: Date, required: true },
  unidade: { type: String, required: true },
  dataDesligamento: { type: Date },
  motivoDesligamento: { type: String },
}, {
  timestamps: true,
  collection: 'internos'
});

export const Interno = model<InternoDoc>('Interno', InternoSchema);
