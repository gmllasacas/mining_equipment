import React from 'react';
import { Truck, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';
import { Equipo } from '../types';

interface MetricsCardsProps {
  equipos: Equipo[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ equipos }) => {
  const totalEquipos = equipos.length;
  const requierenMantenimiento = equipos.filter((e) => e.requiere_mantenimiento).length;
  const operativos = totalEquipos - requierenMantenimiento;
  const totalHoras = equipos.reduce((acc, curr) => acc + curr.horometro, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Total Equipos */}
      <div className="card-cruip p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Maquinaria
          </span>
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{totalEquipos}</span>
          <span className="text-xs text-gray-500">unidades registradas</span>
        </div>
      </div>

      {/* 2. Operativos */}
      <div className="card-cruip p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Equipos Operativos
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-emerald-600">{operativos}</span>
          <span className="inline-flex font-medium bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-xs">
            {totalEquipos > 0 ? `${Math.round((operativos / totalEquipos) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Requieren Servicio */}
      <div className="card-cruip p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Requieren Servicio
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            requierenMantenimiento > 0
              ? 'bg-rose-50 text-rose-600 animate-pulse'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${
            requierenMantenimiento > 0 ? 'text-rose-600' : 'text-gray-900'
          }`}>
            {requierenMantenimiento}
          </span>
          <span className={`inline-flex font-medium rounded-full px-2 py-0.5 text-xs ${
            requierenMantenimiento > 0
              ? 'bg-rose-50 text-rose-700 font-semibold'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {requierenMantenimiento > 0 ? 'Atención Inmediata' : 'Sin Alertas'}
          </span>
        </div>
      </div>

      {/* 4. Total Horas */}
      <div className="card-cruip p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Horas Totales Flota
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {totalHoras.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <span className="text-xs text-gray-500">horas de uso</span>
        </div>
      </div>
    </div>
  );
};
