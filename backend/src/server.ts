import { app } from './app';
import { prisma } from './prisma';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const server = app.listen(PORT, () => {
  console.log(`[API] Servidor iniciado y escuchando en http://localhost:${PORT}`);
  console.log(`[API] Health check disponible en http://localhost:${PORT}/health`);
});

// Manejo de apagado elegante (Graceful Shutdown)
async function shutdown() {
  console.log('\n[API] Apagando servidor de forma ordenada...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[API] Conexión a la base de datos cerrada.');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

