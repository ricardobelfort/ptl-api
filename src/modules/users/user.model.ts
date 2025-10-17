import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true, index: true },
  nome: { type: String, required: true },
  senhaHash: { type: String, required: true },
  perfil: { type: String, enum: ['admin','gestor_regional','gestor_unidade','auditor'], required: true },
  unidadeCodigo: { type: String },
  regioes: [{ type: String }],
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

export type UserDoc = {
  _id: string;
  email: string;
  nome: string;
  senhaHash: string;
  perfil: 'admin'|'gestor_regional'|'gestor_unidade'|'auditor';
  unidadeCodigo?: string;
  regioes?: string[];
  ativo: boolean;
};

export const User = model<UserDoc>('usuarios', UserSchema);
