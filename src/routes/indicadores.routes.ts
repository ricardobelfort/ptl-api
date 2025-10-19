import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { Indicador } from '../modules/indicadores/indicador.model';

/**
 * @openapi
 * /indicadores/kpis:
 *   get:
 *     summary: KPIs por competencia e unidade
 */
export const router = Router();

router.get('/kpis', auth(['admin','DIRETOR','ADJUNTO','GERENTE DE PROJETO']), async (req, res) => {
  const { competencia, unidadeCodigo } = req.query as { competencia?: string; unidadeCodigo?: string; };
  const filtro: any = {};
  if (competencia) filtro.competencia = competencia;
  if (unidadeCodigo) filtro.unidadeCodigo = unidadeCodigo.toUpperCase();

  const docs = await Indicador.find(filtro).lean();
  const kpis = docs.map(d => ({
    competencia: d.competencia,
    unidadeCodigo: d.unidadeCodigo,
    populacaoTotal: d.populacaoTotal,
    internosTrabalhando: d.internosTrabalhando,
    taxaTrabalho: d.taxaTrabalho
  }));
  res.json(kpis);
});
