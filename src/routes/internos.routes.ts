import { Router } from 'express';

import { z } from 'zod';
import { Interno } from '../modules/interno/interno.model';
import { auth } from '../middlewares/auth';

const router = Router();

const createInternoSchema = z.object({
  nome: z.string().min(2),
  funcao: z.string().min(2),
  status: z.enum(['remunerado', 'remicao']),
  dataAdmissao: z.string().datetime(),
  unidade: z.string().min(2)
});

const updateInternoSchema = z.object({
  nome: z.string().min(2).optional(),
  funcao: z.string().min(2).optional(),
  status: z.enum(['remunerado', 'remicao']).optional(),
  dataAdmissao: z.string().datetime().optional(),
  unidade: z.string().min(2).optional(),
  dataDesligamento: z.string().datetime().optional(),
  motivoDesligamento: z.string().optional()
});

/**
 * @openapi
 * /internos:
 *   get:
 *     summary: Lista todos os internos
 *     tags:
 *       - Internos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de internos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Interno'
 */
router.get('/', auth(["ADMIN", "DIRETOR", "ADJUNTO", "GERENTE DE PROJETO"]), async (_req, res) => {
  const internos = await Interno.find();
  res.json(internos);
});
/**
 * @openapi
 * /internos:
 *   post:
 *     summary: Cria um novo interno
 *     tags:
 *       - Internos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InternoCreate'
 *     responses:
 *       201:
 *         description: Interno criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interno'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.post('/', auth(["ADMIN", "GERENTE DE PROJETO"]), async (req, res) => {
  const parse = createInternoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.issues });
  }
  const interno = await Interno.create(parse.data);
  res.status(201).json(interno);
});
/**
 * @openapi
 * /internos/{id}:
 *   put:
 *     summary: Atualiza dados do interno (inclusive desligamento)
 *     tags:
 *       - Internos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do interno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InternoUpdate'
 *     responses:
 *       200:
 *         description: Interno atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interno'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Interno não encontrado
 */
router.put('/:id', auth(["ADMIN", "GERENTE DE PROJETO"]), async (req: any, res: any) => {
  const parse = updateInternoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.issues });
  }
  const interno = await Interno.findByIdAndUpdate(req.params.id, parse.data, { new: true });
  if (!interno) return res.status(404).json({ message: 'Interno não encontrado' });
  res.json(interno);
});


export default router;
