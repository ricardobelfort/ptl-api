import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import { auth } from '../middlewares/auth';
import { processFile } from '../services/ingestao.service';

const upload = multer({
  dest: 'tmp/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ].includes(file.mimetype);
    if (ok) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

export const router = Router();

/**
 * @openapi
 * /uploads:
 *   post:
 *     summary: Upload de planilha (XLSX/CSV)
 *     responses:
 *       200: { description: Processado }
 */
router.post('/', auth(['ADMIN','DIRETOR','ADJUNTO','GERENTE DE PROJETO']), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'arquivo ausente' });
  try {
    const r = await processFile(req.file.path);
    res.json({ status: 'ok', ...r });
  } catch {
    res.status(400).json({ message: 'falha no processamento' });
  } finally {
    // limpeza do arquivo temp
    try { await fs.rm(req.file.path); } catch {}
  }
});
