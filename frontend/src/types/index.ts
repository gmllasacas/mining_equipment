export type TipoEquipo = 'camion' | 'excavadora' | 'perforadora';

export interface Equipo {
  id: number;
  codigo: string;
  tipo: TipoEquipo;
  horometro: number;
  horometro_ultimo_mantenimiento: number;
  intervalo_mantenimiento: number;
  horas_en_ciclo: number;
  requiere_mantenimiento: boolean;
  alerta_preventiva?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Mantenimiento {
  id: number;
  equipo_id: number;
  fecha: string;
  horometro_servicio: number;
  descripcion: string | null;
  tecnico: string | null;
  created_at: string;
}

export interface EquipoDetallado extends Equipo {
  mantenimientos: Mantenimiento[];
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
  };
  uptime: number;
  responseTimeMs?: number;
}

export interface NuevoEquipoPayload {
  codigo: string;
  tipo: TipoEquipo;
  horometro: number;
}

export interface ActualizarEquipoPayload {
  codigo?: string;
  tipo?: TipoEquipo;
  horometro?: number;
}

export interface RegistrarMantenimientoPayload {
  descripcion?: string;
  tecnico?: string;
}

