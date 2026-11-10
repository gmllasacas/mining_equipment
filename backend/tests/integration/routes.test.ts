import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Pruebas de Integración HTTP (Endpoints y Middleware)', () => {
  const API_KEY = process.env.API_KEY || 'mining_secret_key_2026';

  describe('GET /health (Diagnóstico de Salud)', () => {
    it('debe responder HTTP 200 sin requerir cabecera x-api-key', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database', 'connected');
    });
  });

  describe('CORS y Preflight OPTIONS en /api/equipos', () => {
    it('debe responder HTTP 204 ante peticiones preflight OPTIONS sin exigir API key', async () => {
      const response = await request(app)
        .options('/api/equipos')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'x-api-key, Content-Type');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Protección de Rutas en /api/equipos', () => {
    it('debe rechazar con HTTP 401 si no se envía cabecera x-api-key', async () => {
      const response = await request(app).get('/api/equipos');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: true,
        message: expect.stringMatching(/Acceso no autorizado/i),
        details: null,
      });
    });

    it('debe rechazar con HTTP 401 si la clave es incorrecta', async () => {
      const response = await request(app)
        .get('/api/equipos')
        .set('x-api-key', 'clave_falsa');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });

    it('debe responder HTTP 200 cuando se envía x-api-key correcta', async () => {
      const response = await request(app)
        .get('/api/equipos')
        .set('x-api-key', API_KEY);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Validar atributos dinámicos del contrato
      const primerEquipo = response.body[0];
      expect(primerEquipo).toHaveProperty('codigo');
      expect(primerEquipo).toHaveProperty('tipo');
      expect(primerEquipo).toHaveProperty('horometro');
      expect(primerEquipo).toHaveProperty('horas_en_ciclo');
      expect(primerEquipo).toHaveProperty('requiere_mantenimiento');
      expect(primerEquipo).toHaveProperty('alerta_preventiva');
    });

    it('debe responder HTTP 200 cuando se envía Authorization Bearer correcta', async () => {
      const response = await request(app)
        .get('/api/equipos')
        .set('Authorization', `Bearer ${API_KEY}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

