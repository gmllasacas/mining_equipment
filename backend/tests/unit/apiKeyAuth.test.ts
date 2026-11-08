import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { apiKeyAuth } from '../../src/middleware/apiKeyAuth';

describe('Middleware de Autenticación por API Key (apiKeyAuth)', () => {
  const originalEnv = process.env.API_KEY;
  const TEST_API_KEY = 'test_secret_api_key_123';

  beforeEach(() => {
    process.env.API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    process.env.API_KEY = originalEnv;
  });

  function mockRequestResponse(options: {
    method?: string;
    headers?: Record<string, string>;
  }) {
    const headers = options.headers || {};
    const req = {
      method: options.method || 'GET',
      header: vi.fn((name: string) => headers[name.toLowerCase()]),
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  it('debe permitir peticiones preflight OPTIONS sin verificar API key', () => {
    const { req, res, next } = mockRequestResponse({ method: 'OPTIONS' });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe responder 500 si la variable API_KEY no está configurada en el servidor', () => {
    delete process.env.API_KEY;
    const { req, res, next } = mockRequestResponse({
      headers: { 'x-api-key': TEST_API_KEY },
    });

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringMatching(/Error de configuración/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si no se envía la cabecera x-api-key ni Authorization', () => {
    const { req, res, next } = mockRequestResponse({
      headers: {},
    });

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringMatching(/Acceso no autorizado/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si la cabecera x-api-key es incorrecta', () => {
    const { req, res, next } = mockRequestResponse({
      headers: { 'x-api-key': 'clave_invalida' },
    });

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringMatching(/inválida o está ausente/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe invocar next() cuando se proporciona una cabecera x-api-key válida', () => {
    const { req, res, next } = mockRequestResponse({
      headers: { 'x-api-key': TEST_API_KEY },
    });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe invocar next() cuando se proporciona un Bearer token válido en Authorization', () => {
    const { req, res, next } = mockRequestResponse({
      headers: { authorization: `Bearer ${TEST_API_KEY}` },
    });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el Bearer token en Authorization es inválido', () => {
    const { req, res, next } = mockRequestResponse({
      headers: { authorization: 'Bearer clave_incorrecta' },
    });

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

