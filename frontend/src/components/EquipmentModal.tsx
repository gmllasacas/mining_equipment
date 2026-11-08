import React, { useState, useEffect } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { Equipo, TipoEquipo, NuevoEquipoPayload, ActualizarEquipoPayload } from '../types';
import { Modal } from './Modal';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NuevoEquipoPayload | ActualizarEquipoPayload) => Promise<void>;
  equipoToEdit?: Equipo | null;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipoToEdit,
}) => {
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<TipoEquipo>('camion');
  const [horometro, setHorometro] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (equipoToEdit) {
      setCodigo(equipoToEdit.codigo);
      setTipo(equipoToEdit.tipo);
      setHorometro(equipoToEdit.horometro);
    } else {
      setCodigo('');
      setTipo('camion');
      setHorometro(0);
    }
    setError(null);
  }, [equipoToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!codigo.trim()) {
      setError('El código de equipo es obligatorio');
      return;
    }

    if (horometro < 0) {
      setError('El horómetro no puede ser negativo');
      return;
    }

    if (equipoToEdit && horometro < equipoToEdit.horometro_ultimo_mantenimiento) {
      setError(
        `El horómetro no puede ser inferior al último servicio registrado (${equipoToEdit.horometro_ultimo_mantenimiento}h)`
      );
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        codigo: codigo.trim().toUpperCase(),
        tipo,
        horometro: Number(horometro),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-gray-800">
            {equipoToEdit ? 'Editar Equipo Minero' : 'Registrar Nuevo Equipo'}
          </h2>
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

        {/* Código */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Código Único
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej. CAM-105"
              className="form-input font-mono"
              required
            />
          </div>

          {/* Tipo de Maquinaria */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Tipo de Maquinaria
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo('camion')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  tipo === 'camion'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="text-xs">Camión</div>
                <div className="text-[10px] text-gray-400 font-mono">500h</div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('excavadora')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  tipo === 'excavadora'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="text-xs">Excavadora</div>
                <div className="text-[10px] text-gray-400 font-mono">250h</div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('perforadora')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  tipo === 'perforadora'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="text-xs">Perforadora</div>
                <div className="text-[10px] text-gray-400 font-mono">300h</div>
              </button>
            </div>
          </div>

          {/* Horómetro */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              {equipoToEdit ? 'Lectura Actual' : 'Horómetro Inicial'} (Horas)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={horometro}
              onChange={(e) => setHorometro(parseFloat(e.target.value) || 0)}
              className="form-input font-mono"
              required
            />
            {equipoToEdit && (
              <p className="text-[11px] text-gray-400 mt-1">
                Horómetro en último servicio: {equipoToEdit.horometro_ultimo_mantenimiento}h
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end space-x-2">
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
              className="btn-primary"
            >
              {loading ? 'Guardando...' : equipoToEdit ? 'Guardar Cambios' : 'Crear Equipo'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
