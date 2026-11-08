import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function checkHealth(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    // Consulta ligera a la base de datos para verificar conexión activa
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
      uptime: process.uptime(),
      responseTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
      },
      error: 'No se pudo conectar con la base de datos',
      details: error instanceof Error ? error.message : null,
    });
  }
}

