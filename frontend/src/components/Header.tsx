import React from 'react';
import { Plus, RefreshCw, CheckCircle2, AlertTriangle, HardHat, Loader2 } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  loadingHealth: boolean;
  onPingHealth: () => void;
  onNewEquipment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  loadingHealth,
  onPingHealth,
  onNewEquipment,
}) => {
  const isHealthy = health?.status === 'healthy' && health?.services?.database === 'connected';

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100 shadow-2xs">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900 tracking-tight">
                  Registro de Equipos Mineros
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Monitoreo de horómetros y control de ciclos de mantenimiento
              </p>
            </div>
          </div>

          {/* Right Actions: Interactive Health Tag/Button + New Equipment */}
          <div className="flex items-center space-x-3">
            {/* Interactive Health Tag / Button */}
            <button
              onClick={onPingHealth}
              disabled={loadingHealth}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 hover:shadow-2xs active:scale-95 disabled:opacity-75 ${
                loadingHealth
                  ? 'bg-gray-100 text-gray-600 border-gray-300'
                  : isHealthy
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
              title={
                health
                  ? `Clic para ejecutar ping. Estado: ${health.status} | DB: ${health.services.database} | Latencia: ${health.responseTimeMs || 2}ms`
                  : 'Clic para comprobar conexión con la API'
              }
            >
              {loadingHealth ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                  <span>Comprobando...</span>
                </>
              ) : isHealthy ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API Saludable</span>
                  <RefreshCw className="w-3 h-3 text-emerald-600 opacity-60 hover:opacity-100 ml-0.5" />
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>API Desconectada</span>
                  <RefreshCw className="w-3 h-3 text-rose-600 ml-0.5" />
                </>
              )}
            </button>

            {/* New Equipment button */}
            <button
              onClick={onNewEquipment}
              className="btn bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Equipo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
