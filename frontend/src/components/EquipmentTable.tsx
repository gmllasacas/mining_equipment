import React from 'react';
import {
  Truck,
  Hammer,
  Cog,
  Wrench,
  History,
  Edit2,
  Trash2,
  FastForward,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Equipo, TipoEquipo } from '../types';

interface EquipmentTableProps {
  equipos: Equipo[];
  onSimulateHours: (equipo: Equipo, increment: number) => void;
  onRegisterMaintenance: (equipo: Equipo) => void;
  onViewHistory: (equipo: Equipo) => void;
  onEdit: (equipo: Equipo) => void;
  onDelete: (equipo: Equipo) => void;
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipos,
  onSimulateHours,
  onRegisterMaintenance,
  onViewHistory,
  onEdit,
  onDelete,
}) => {
  const getTipoIcon = (tipo: TipoEquipo) => {
    switch (tipo) {
      case 'camion':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'excavadora':
        return <Hammer className="w-4 h-4 text-sky-600" />;
      case 'perforadora':
        return <Cog className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getTipoLabel = (tipo: TipoEquipo) => {
    switch (tipo) {
      case 'camion':
        return 'Camión';
      case 'excavadora':
        return 'Excavadora';
      case 'perforadora':
        return 'Perforadora';
    }
  };

  return (
    <div className="card-cruip overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-left text-sm divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="text-xs font-semibold uppercase text-gray-500 bg-gray-50/80">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">Código</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Tipo</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Horómetro Total</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Ciclo Operativo</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Estado</th>
              <th className="px-5 py-3.5 whitespace-nowrap text-right">Acciones</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 font-medium">
            {equipos.map((equipo) => {
              const percentage = Math.min(
                100,
                Math.round((equipo.horas_en_ciclo / equipo.intervalo_mantenimiento) * 100)
              );

              return (
                <tr
                  key={equipo.id}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  {/* Código */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                        {getTipoIcon(equipo.tipo)}
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        {equipo.codigo}
                      </span>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    <div className="text-xs font-semibold text-gray-900">{getTipoLabel(equipo.tipo)}</div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Intervalo: {equipo.intervalo_mantenimiento}h
                    </div>
                  </td>

                  {/* Horómetro Total */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-gray-900">
                      {equipo.horometro.toLocaleString('es-ES', { minimumFractionDigits: 1 })}h
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Últ. serv: {equipo.horometro_ultimo_mantenimiento}h
                    </div>
                  </td>

                  {/* Progreso Ciclo */}
                  <td className="px-4 py-4 whitespace-nowrap min-w-[160px]">
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-gray-500">
                        {equipo.horas_en_ciclo} / {equipo.intervalo_mantenimiento}h
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
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {equipo.requiere_mantenimiento ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Requiere Mantenimiento
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Operativo
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* +50h Simulator */}
                      <button
                        onClick={() => onSimulateHours(equipo, 50)}
                        className="px-2 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-amber-700 font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                        title="Simular uso: sumar +50 horas"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>+50h</span>
                      </button>

                      {/* Register Maintenance */}
                      <button
                        onClick={() => onRegisterMaintenance(equipo)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-2xs ${
                          equipo.requiere_mantenimiento
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                        title="Registrar mantenimiento"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Servicio</span>
                      </button>

                      {/* History */}
                      <button
                        onClick={() => onViewHistory(equipo)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Ver historial de intervenciones"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(equipo)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Editar equipo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(equipo)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar equipo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
