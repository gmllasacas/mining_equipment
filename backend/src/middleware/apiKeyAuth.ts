import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Peticiones preflight OPTIONS pasan sin autenticación
  if (req.method === 'OPTIONS') {
    return next();
  }

  const configuredApiKey = process.env.API_KEY;

  // Si no está configurada la variable en el entorno, bloquear por seguridad
  if (!configuredApiKey) {
    console.error('[Seguridad] Variable API_KEY no configurada en el servidor.');
    return res.status(500).json({
      error: true,
      message: 'Error de configuración de seguridad en el servidor',
      details: null,
    });
  }

  // Leer desde cabecera 'x-api-key' o 'Authorization: Bearer <key>'
  const headerApiKey = req.header('x-api-key');
  const authHeader = req.header('authorization');

  let providedKey: string | undefined;

  if (headerApiKey) {
    providedKey = headerApiKey.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.substring(7).trim();
  }

  if (!providedKey || providedKey !== configuredApiKey) {
    return res.status(401).json({
      error: true,
      message: 'Acceso no autorizado: la cabecera x-api-key o Authorization Bearer es inválida o está ausente',
      details: null,
    });
  }

  return next();
}

