import React, { useState, useRef } from 'react';
import { X, Wrench, AlertCircle, CheckCircle } from 'lucide-react';
import { Equipo, RegistrarMantenimientoPayload } from '../types';
import { Modal } from './Modal';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (equipoId: number, payload: RegistrarMantenimientoPayload) => Promise<void>;
  equipo: Equipo | null;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipo,
}) => {
  const [tecnico, setTecnico] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preserve equipment reference during exit transition
  const activeEquipo = useRef(equipo);
  if (equipo) {
    activeEquipo.current = equipo;
  }
  const currentEquipo = equipo || activeEquipo.current;

  if (!currentEquipo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await onSubmit(currentEquipo.id, {
        tecnico: tecnico.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
      });
      setTecnico('');
      setDescripcion('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Registrar Servicio de Mantenimiento
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Atomic explanation */}
        <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Reinicio Atómico de Ciclo:</span>
          </div>
          <p className="text-gray-500 leading-relaxed">
            El servicio se fijará en <strong className="font-mono text-gray-800">{currentEquipo.horometro}h</strong> y el contador de horas transcurridas en el ciclo volverá a <strong className="font-mono text-emerald-600">0h</strong>.
          </p>
        </div>

        {/* Técnico */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
            Técnico Responsable
          </label>
          <input
            type="text"
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
            placeholder="Ej. Ing. Carlos Pérez"
            className="form-input"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
            Observaciones del Servicio
          </label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Cambio de aceite, filtros y revisión de sistema hidráulico."
            className="form-input resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn bg-rose-500 hover:bg-rose-600 text-white shadow-sm disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Confirmar Mantenimiento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
