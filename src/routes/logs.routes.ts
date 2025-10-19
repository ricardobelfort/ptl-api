import { Router } from 'express';
import { auth } from '@/middlewares/auth';
import { AccessLog } from '@/modules/logs/access-log.model';

/**
 * @swagger
 * /logs/access:
 *   get:
 *     summary: Lista logs de acesso (admin only)
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página dos resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 500
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtrar por email do usuário
 *       - in: query
 *         name: perfil
 *         schema:
 *           type: string
 *         description: Filtrar por perfil do usuário
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de sucesso
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *         description: Filtrar por método HTTP
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de logs de acesso
 *       403:
 *         description: Acesso negado - apenas admin
 */

export const router = Router();

router.get('/access', auth(['admin']), async (req, res) => {
  try {
    const {
      page,
      limit,
      email,
      perfil,
      success,
      method,
      startDate,
      endDate
    } = req.query as {
      page?: string;
      limit?: string;
      email?: string;
      perfil?: string;
      success?: string;
      method?: string;
      startDate?: string;
      endDate?: string;
    };

    // Validação dos parâmetros
    const pageStr = page || '1';
    const limitStr = limit || '50';
    const parsedPage = parseInt(pageStr, 10);
    const parsedLimit = parseInt(limitStr, 10);
    const pageNum = Math.max(1, isNaN(parsedPage) ? 1 : parsedPage);
    const limitNum = Math.min(500, Math.max(1, isNaN(parsedLimit) ? 50 : parsedLimit));
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const filter: any = {};

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (perfil) {
      filter.perfil = perfil;
    }

    if (success !== undefined) {
      filter.success = success === 'true';
    }

    if (method) {
      filter.method = method.toUpperCase();
    }

    // Filtro de data
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Incluir o dia inteiro
        filter.timestamp.$lte = endDateTime;
      }
    }

    // Buscar logs com paginação
    const [logs, total] = await Promise.all([
      AccessLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AccessLog.countDocuments(filter)
    ]);

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        email,
        perfil,
        success,
        method,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de acesso:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @swagger
 * /logs/access/stats:
 *   get:
 *     summary: Estatísticas dos logs de acesso (admin only)
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Estatísticas dos logs
 */

router.get('/access/stats', auth(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    // Filtro de data
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.timestamp.$lte = endDateTime;
      }
    }

    // Agregações para estatísticas
    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      uniqueUsers,
      topUsers,
      methodStats,
      perfilStats,
      avgResponseTime
    ] = await Promise.all([
      AccessLog.countDocuments(dateFilter),
      AccessLog.countDocuments({ ...dateFilter, success: true }),
      AccessLog.countDocuments({ ...dateFilter, success: false }),
      AccessLog.distinct('userId', dateFilter).then(users => users.length),
      AccessLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$email', count: { $sum: 1 }, nome: { $first: '$nome' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AccessLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$method', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AccessLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$perfil', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AccessLog.aggregate([
        { $match: { ...dateFilter, responseTime: { $exists: true } } },
        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
      ])
    ]);

    res.json({
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0,
        uniqueUsers,
        avgResponseTime: avgResponseTime[0]?.avgTime ? Math.round(avgResponseTime[0].avgTime) : null
      },
      topUsers: topUsers.map(user => ({
        email: user._id,
        nome: user.nome,
        requestCount: user.count
      })),
      methodDistribution: methodStats,
      perfilDistribution: perfilStats,
      period: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas dos logs:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});