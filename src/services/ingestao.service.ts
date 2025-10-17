import xlsx from 'xlsx';
import { z } from 'zod';
import { Indicador } from '../modules/indicadores/indicador.model';

const IndicadorSchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/),
  unidadeCodigo: z.string().min(2).transform(s=>s.trim().toUpperCase()),
  populacaoTotal: z.coerce.number().int().nonnegative(),
  internosTrabalhando: z.coerce.number().int().nonnegative()
}).transform(d => ({ ...d, taxaTrabalho: d.populacaoTotal ? d.internosTrabalhando / d.populacaoTotal : 0 }));

function sanitizeCell(v: any) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (/^[=\-+@]/.test(t)) return `'${t}`;
  return t;
}

export async function processFile(filePath: string) {
  const wb = xlsx.readFile(filePath, { cellDates: false });
  const sheet = wb.Sheets['Indicadores'] || wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<any>(sheet, { defval: null }).map(r => {
    const obj: any = {};
    for (const k of Object.keys(r)) obj[k] = sanitizeCell(r[k]);
    return obj;
  });

  const valids: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      valids.push(IndicadorSchema.parse(rows[i]));
    } catch (e: any) {
      errors.push(`linha ${i + 2}: ${e.message}`);
    }
  }

  if (valids.length) {
    await Indicador.bulkWrite(
      valids.map(doc => ({
        updateOne: {
          filter: { unidadeCodigo: doc.unidadeCodigo, competencia: doc.competencia },
          update: { $set: doc },
          upsert: true
        }
      }))
    );
  }

  return { total: rows.length, inseridosOuAtualizados: valids.length, erros: errors };
}
