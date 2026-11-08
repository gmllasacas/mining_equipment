import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Equipo } from '../types';
import { Modal } from './Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  equipo: Equipo | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  equipo,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preserve equipment reference during exit transition
  const activeEquipo = useRef(equipo);
  if (equipo) {
    activeEquipo.current = equipo;
  }
  const currentEquipo = equipo || activeEquipo.current;

  if (!currentEquipo) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el equipo');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Trash2 className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-gray-800">
            Confirmar Eliminación
          </h2>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {error && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          <p>
            ¿Estás seguro de que deseas eliminar el equipo{' '}
            <span className="font-bold text-gray-900 font-mono">
              {currentEquipo.codigo}
            </span>{' '}
            ({currentEquipo.tipo})?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Acción permanente e irreversible
            </p>
            <p>
              Se eliminará el equipo y todo su historial de mantenimientos asociado en la base de datos.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Equipo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

