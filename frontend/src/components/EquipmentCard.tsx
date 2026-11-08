import React from 'react';
import {
  Truck,
  Hammer,
  Cog,
  Wrench,
  History,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FastForward,
} from 'lucide-react';
import { Equipo, TipoEquipo } from '../types';

interface EquipmentCardProps {
  equipo: Equipo;
  onSimulateHours: (equipo: Equipo, increment: number) => void;
  onRegisterMaintenance: (equipo: Equipo) => void;
  onViewHistory: (equipo: Equipo) => void;
  onEdit: (equipo: Equipo) => void;
  onDelete: (equipo: Equipo) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipo,
  onSimulateHours,
  onRegisterMaintenance,
  onViewHistory,
  onEdit,
  onDelete,
}) => {
  const percentage = Math.min(
    100,
    Math.round((equipo.horas_en_ciclo / equipo.intervalo_mantenimiento) * 100)
  );

  const getTipoIcon = (tipo: TipoEquipo) => {
    switch (tipo) {
      case 'camion':
        return <Truck className="w-5 h-5 text-amber-600" />;
      case 'excavadora':
        return <Hammer className="w-5 h-5 text-sky-600" />;
      case 'perforadora':
        return <Cog className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getTipoLabel = (tipo: TipoEquipo) => {
    switch (tipo) {
      case 'camion':
        return 'Camión Minero';
      case 'excavadora':
        return 'Excavadora Hidráulica';
      case 'perforadora':
        return 'Perforadora de Oruga';
    }
  };

  return (
    <div
      className={`card-cruip p-5 flex flex-col justify-between transition-all duration-200 ${
        equipo.requiere_mantenimiento
          ? 'ring-2 ring-rose-500/60 shadow-md'
          : 'hover:shadow-md'
      }`}
    >
      <div>
        {/* Top: Icon, Code & Options */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              {getTipoIcon(equipo.tipo)}
            </div>
            <div>
              <div className="font-mono font-bold text-base text-gray-900">
                {equipo.codigo}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {getTipoLabel(equipo.tipo)}
              </div>
            </div>
          </div>

          {/* Quick Menu */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(equipo)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Editar equipo"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(equipo)}
              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Eliminar equipo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {equipo.requiere_mantenimiento ? (
            <span className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Requiere Mantenimiento Urgente
            </span>
          ) : (
            <span className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Operativo ({equipo.intervalo_mantenimiento - equipo.horas_en_ciclo}h restantes)
            </span>
          )}
        </div>

        {/* Horometer readings */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-100 mb-4 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5">Horómetro Total:</span>
            <span className="text-sm font-bold font-mono text-gray-900">
              {equipo.horometro.toLocaleString('es-ES', { minimumFractionDigits: 1 })}h
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Último Servicio:</span>
            <span className="text-sm font-bold font-mono text-gray-700">
              {equipo.horometro_ultimo_mantenimiento.toLocaleString('es-ES', { minimumFractionDigits: 1 })}h
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 space-y-1.5">
          <div className="flex justify-between text-xs font-mono font-medium">
            <span className="text-gray-500">
              Ciclo: {equipo.horas_en_ciclo} / {equipo.intervalo_mantenimiento}h
            </span>
            <span
              className={`font-semibold ${
                equipo.requiere_mantenimiento
                  ? 'text-rose-600'
                  : percentage >= 80
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                equipo.requiere_mantenimiento
                  ? 'bg-rose-500'
                  : percentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {/* +50h Simulator */}
        <button
          onClick={() => onSimulateHours(equipo, 50)}
          className="btn-secondary text-xs px-2.5 py-1.5 text-amber-700 font-semibold gap-1"
          title="Simular uso: incrementa +50 horas"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>+50h</span>
        </button>

        <div className="flex items-center space-x-1.5">
          {/* History */}
          <button
            onClick={() => onViewHistory(equipo)}
            className="btn-secondary text-xs px-2.5 py-1.5 gap-1"
            title="Ver historial de intervenciones"
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial</span>
          </button>

          {/* Maintenance */}
          <button
            onClick={() => onRegisterMaintenance(equipo)}
            className={`btn text-xs px-2.5 py-1.5 gap-1 ${
              equipo.requiere_mantenimiento
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Servicio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
