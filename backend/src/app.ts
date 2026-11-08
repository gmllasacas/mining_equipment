import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes';
import equiposRoutes from './routes/equiposRoutes';
import { apiKeyAuth } from './middleware/apiKeyAuth';

dotenv.config();

export const app = express();

// Configuración de CORS
const corsOriginEnv = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOriginEnv.includes(',')
  ? corsOriginEnv.split(',').map((origin) => origin.trim())
  : corsOriginEnv;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (ej. curl, Postman o scripts internos)
    if (!origin || corsOriginEnv === '*') {
      return callback(null, true);
    }
    if (Array.isArray(allowedOrigins)) {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    } else if (allowedOrigins === origin) {
      return callback(null, true);
    }
    // Para desarrollo local, permitir orígenes localhost
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error(`Bloqueado por CORS: origen no permitido (${origin})`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Endpoint de diagnóstico de salud requerido por el reto (acceso público sin API key)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Rutas de API REST protegidas mediante API Key
app.use('/api/equipos', apiKeyAuth, equiposRoutes);

// Ruta raíz informativa
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'API de Registro de Equipos Mineros',
    version: '1.0.0',
    health: '/health',
    endpoints: {
      equipos: '/api/equipos',
    },
  });
});

// Manejo de rutas inexistentes (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: true,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    details: null,
  });
});

// Manejador global de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: true,
    message: err.message || 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
});

