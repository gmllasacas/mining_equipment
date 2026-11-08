import {
  Equipo,
  EquipoDetallado,
  HealthStatus,
  NuevoEquipoPayload,
  ActualizarEquipoPayload,
  RegistrarMantenimientoPayload,
  Mantenimiento,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || '';

class ApiError extends Error {
  constructor(message: string, public status: number, public details: unknown = null) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Inyectar x-api-key si está configurada (salvo para /health que es público)
  if (API_KEY && !endpoint.includes('/health')) {
    headers['x-api-key'] = API_KEY;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Error HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(errorMessage, response.status, data?.details);
  }

  return data as T;
}

export const api = {
  // Diagnóstico
  async checkHealth(): Promise<HealthStatus> {
    return request<HealthStatus>('/health');
  },

  // Equipos
  async getEquipos(): Promise<Equipo[]> {
    return request<Equipo[]>('/api/equipos');
  },

  async getEquipoById(id: number): Promise<EquipoDetallado> {
    return request<EquipoDetallado>(`/api/equipos/${id}`);
  },

  async createEquipo(payload: NuevoEquipoPayload): Promise<Equipo> {
    return request<Equipo>('/api/equipos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateEquipo(id: number, payload: ActualizarEquipoPayload): Promise<Equipo> {
    return request<Equipo>(`/api/equipos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteEquipo(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/equipos/${id}`, {
      method: 'DELETE',
    });
  },

  // Mantenimientos
  async createMantenimiento(
    equipoId: number,
    payload: RegistrarMantenimientoPayload
  ): Promise<{ error: boolean; message: string; mantenimiento: Mantenimiento; equipo: Equipo }> {
    return request(`/api/equipos/${equipoId}/mantenimientos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMantenimientos(equipoId: number): Promise<Mantenimiento[]> {
    return request<Mantenimiento[]>(`/api/equipos/${equipoId}/mantenimientos`);
  },
};

