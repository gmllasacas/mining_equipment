import React, { useEffect, useState, useRef } from 'react';
import { X, History, Calendar, User, Clock, FileText, Loader2 } from 'lucide-react';
import { Equipo, Mantenimiento } from '../types';
import { api } from '../services/apiClient';
import { Modal } from './Modal';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo | null;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  equipo,
}) => {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preserve equipment reference during exit transition
  const activeEquipo = useRef(equipo);
  if (equipo) {
    activeEquipo.current = equipo;
  }
  const currentEquipo = equipo || activeEquipo.current;

  useEffect(() => {
    if (isOpen && currentEquipo) {
      setLoading(true);
      setError(null);
      api
        .getMantenimientos(currentEquipo.id)
        .then((data) => setMantenimientos(data))
        .catch((err) => setError(err.message || 'Error al cargar el historial'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentEquipo]);

  if (!currentEquipo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      className="max-h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Historial de Mantenimientos
            </h2>
            <p className="text-xs text-gray-400">
              Equipo: <span className="font-mono font-semibold text-gray-700">{currentEquipo.codigo}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content list */}
      <div className="p-6 overflow-y-auto space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-xs">Cargando intervenciones históricas...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs text-center">
            {error}
          </div>
        ) : mantenimientos.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">Sin mantenimientos registrados</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Este equipo aún no ha completado su primer ciclo de servicio programado.
            </p>
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-200">
            {mantenimientos.map((m) => (
              <div
                key={m.id}
                className="relative pl-9 bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-xs"
              >
                {/* Dot */}
                <span className="absolute left-2.5 top-5 w-3 h-3 rounded-full bg-violet-500 border-2 border-white shadow-xs" />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-gray-200/60 mb-2">
                  <div className="flex items-center space-x-1.5 text-gray-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                    <span>{new Date(m.fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>

                  <div className="flex items-center space-x-1 font-mono text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{m.horometro_servicio} hrs</span>
                  </div>
                </div>

                {m.tecnico && (
                  <div className="flex items-center space-x-1.5 text-xs text-gray-600 mb-1">
                    <User className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Técnico: <strong className="text-gray-900">{m.tecnico}</strong></span>
                  </div>
                )}

                {m.descripcion ? (
                  <div className="flex items-start space-x-1.5 text-xs text-gray-500 mt-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{m.descripcion}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sin observaciones registradas.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
        <button
          onClick={onClose}
          className="btn-secondary text-xs"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};
