import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  AlertTriangle,
  HardHat,
  CheckCircle2,
  Info,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  Equipo,
  HealthStatus,
  NuevoEquipoPayload,
  ActualizarEquipoPayload,
  RegistrarMantenimientoPayload,
} from './types';
import { api } from './services/apiClient';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { EquipmentCard } from './components/EquipmentCard';
import { EquipmentTable } from './components/EquipmentTable';
import { EquipmentModal } from './components/EquipmentModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { HistoryModal } from './components/HistoryModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export function App() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notification helper with transitions
  const showNotification = useCallback(
    (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToast({ message, type, visible: true });
      toastTimeoutRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // View Mode: Table (default) vs Grid
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'operativo' | 'alerta'>('todos');

  // Modal States
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [equipoToEdit, setEquipoToEdit] = useState<Equipo | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [equipoForMaintenance, setEquipoForMaintenance] = useState<Equipo | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [equipoForHistory, setEquipoForHistory] = useState<Equipo | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState<Equipo | null>(null);

  // Ping / Fetch health
  const checkHealth = useCallback(async (isManualPing = false) => {
    try {
      setLoadingHealth(true);
      const data = await api.checkHealth();
      setHealth(data);
      if (isManualPing) {
        showNotification(
          `Ping exitoso: API y base de datos respondiendo en ${data.responseTimeMs || 2}ms`,
          'success'
        );
      }
    } catch (err: any) {
      setHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: { database: 'disconnected' },
        uptime: 0,
      });
      if (isManualPing) {
        showNotification(`Fallo de conexión con la API: ${err.message}`, 'error');
      }
    } finally {
      setLoadingHealth(false);
    }
  }, [showNotification]);

  // Fetch equipos
  const fetchEquipos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEquipos();
      setEquipos(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipos();
    checkHealth(false);
    // Verificación automática periódica del endpoint /health cada 10 minutos
    const interval = setInterval(() => checkHealth(false), 600000);
    return () => clearInterval(interval);
  }, [fetchEquipos, checkHealth]);

  // Handle Equipment Save (Create / Update)
  const handleSaveEquipment = async (payload: NuevoEquipoPayload | ActualizarEquipoPayload) => {
    if (equipoToEdit) {
      const updated = await api.updateEquipo(equipoToEdit.id, payload);
      setEquipos((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      showNotification(`Equipo ${updated.codigo} actualizado exitosamente`, 'success');
    } else {
      const created = await api.createEquipo(payload as NuevoEquipoPayload);
      setEquipos((prev) => [...prev, created]);
      showNotification(`Equipo ${created.codigo} registrado exitosamente`, 'success');
    }
    setEquipoToEdit(null);
  };

  // Handle Simulate Hours (+50h)
  const handleSimulateHours = async (equipo: Equipo, increment: number) => {
    try {
      const nuevoHorometro = Number((equipo.horometro + increment).toFixed(2));
      const updated = await api.updateEquipo(equipo.id, { horometro: nuevoHorometro });
      setEquipos((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (updated.requiere_mantenimiento && !equipo.requiere_mantenimiento) {
        showNotification(
          `¡Alerta! ${updated.codigo} alcanzó el umbral (${updated.horas_en_ciclo}h en ciclo) y requiere mantenimiento preventivo.`,
          'warning'
        );
      } else {
        showNotification(
          `+${increment}h añadidas a ${updated.codigo} (Total: ${updated.horometro}h, Ciclo: ${updated.horas_en_ciclo}h)`,
          'info'
        );
      }
    } catch (err: any) {
      alert(`Error al simular horas: ${err.message}`);
    }
  };

  // Handle Maintenance Registration
  const handleRegisterMaintenance = async (
    equipoId: number,
    payload: RegistrarMantenimientoPayload
  ) => {
    const res = await api.createMantenimiento(equipoId, payload);
    setEquipos((prev) => prev.map((e) => (e.id === res.equipo.id ? res.equipo : e)));
    showNotification(
      `Mantenimiento registrado para ${res.equipo.codigo}. Ciclo reiniciado a 0h.`,
      'success'
    );
  };

  // Handle Delete Equipment Request (Open Modal)
  const handleRequestDelete = (equipo: Equipo) => {
    setEquipoToDelete(equipo);
    setIsDeleteModalOpen(true);
  };

  // Handle Confirm Delete Equipment
  const handleConfirmDelete = async () => {
    if (!equipoToDelete) return;
    await api.deleteEquipo(equipoToDelete.id);
    setEquipos((prev) => prev.filter((e) => e.id !== equipoToDelete.id));
    showNotification(`Equipo ${equipoToDelete.codigo} eliminado correctamente`, 'info');
    setEquipoToDelete(null);
  };

  // Filtered List
  const filteredEquipos = useMemo(() => {
    return equipos.filter((item) => {
      const matchesSearch = item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo === 'todos' || item.tipo === filterTipo;
      const matchesEstado =
        filterEstado === 'todos' ||
        (filterEstado === 'alerta' && item.requiere_mantenimiento) ||
        (filterEstado === 'operativo' && !item.requiere_mantenimiento);

      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [equipos, searchTerm, filterTipo, filterEstado]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-inter flex flex-col">
      {/* Toast Notification Container with Transitions */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out transform ${
          toast.visible
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div
          className={`flex items-start gap-3.5 px-4 py-3.5 rounded-xl shadow-2xl border min-w-[320px] max-w-md backdrop-blur-xs ${
            toast.type === 'error'
              ? 'bg-gray-900 border-rose-500/50 text-white shadow-rose-950/20'
              : toast.type === 'warning'
              ? 'bg-gray-900 border-amber-500/50 text-white shadow-amber-950/20'
              : toast.type === 'info'
              ? 'bg-gray-900 border-violet-500/50 text-white shadow-violet-950/20'
              : 'bg-gray-900 border-emerald-500/50 text-white shadow-emerald-950/20'
          }`}
          role="status"
          aria-live="polite"
        >
          {/* Icon Badge */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-rose-500/20 text-rose-400'
                : toast.type === 'warning'
                ? 'bg-amber-500/20 text-amber-400'
                : toast.type === 'info'
                ? 'bg-violet-500/20 text-violet-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            {toast.type === 'info' && <Info className="w-4 h-4" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          </div>

          {/* Message content */}
          <div className="flex-1 pt-0.5">
            <p className="text-xs font-semibold leading-relaxed text-gray-100">
              {toast.message}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissToast}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Header */}
      <Header
        health={health}
        loadingHealth={loadingHealth}
        onPingHealth={() => checkHealth(true)}
        onNewEquipment={() => {
          setEquipoToEdit(null);
          setIsEquipmentModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Page Title & View Switcher */}
        <div className="sm:flex sm:justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Control de Flota y Mantenimiento
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Monitoreo continuo de horómetros y seguimiento de ciclos de mantenimiento preventivo
            </p>
          </div>

          {/* View Switcher (Table vs Grid) */}
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-2xs flex items-center space-x-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="Vista en Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <MetricsCards equipos={equipos} />

        {/* Search & Filter Toolbar */}
        <div className="card-cruip p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej. CAM-101)..."
              className="form-input pl-9 font-mono"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {/* Filter by Type */}
            <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-1 rounded-lg">
              <span className="text-gray-400 px-2 flex items-center gap-1 font-semibold">
                <Filter className="w-3 h-3" /> Tipo:
              </span>
              {(['todos', 'camion', 'excavadora', 'perforadora'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFilterTipo(tipo)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    filterTipo === tipo
                      ? 'bg-white text-violet-700 font-bold shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {/* Filter by Status */}
            <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setFilterEstado('todos')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterEstado === 'todos'
                    ? 'bg-white text-gray-900 font-bold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterEstado('operativo')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterEstado === 'operativo'
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Operativos
              </button>
              <button
                onClick={() => setFilterEstado('alerta')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterEstado === 'alerta'
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Requiere Servicio
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            <p className="text-sm text-gray-500">Cargando flota minera...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 max-w-lg mx-auto flex items-start space-x-3 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold text-sm">Error de Comunicación con el Servidor</p>
                <p className="text-xs text-rose-600 mt-1">{error}</p>
                <button
                  onClick={() => {
                    fetchEquipos();
                    checkHealth(true);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold"
                >
                  Reintentar Conexión
                </button>
              </div>
            </div>
          </div>
        ) : filteredEquipos.length === 0 ? (
          <div className="py-20 text-center space-y-3 card-cruip">
            <HardHat className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-semibold text-gray-800">No se encontraron equipos</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || filterTipo !== 'todos' || filterEstado !== 'todos'
                ? 'Ninguna maquinaria coincide con los criterios de búsqueda y filtros seleccionados.'
                : 'Aún no hay maquinaria registrada en el sistema. Comienza creando un nuevo equipo.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <EquipmentTable
            equipos={filteredEquipos}
            onSimulateHours={handleSimulateHours}
            onRegisterMaintenance={(e) => {
              setEquipoForMaintenance(e);
              setIsMaintenanceModalOpen(true);
            }}
            onViewHistory={(e) => {
              setEquipoForHistory(e);
              setIsHistoryModalOpen(true);
            }}
            onEdit={(e) => {
              setEquipoToEdit(e);
              setIsEquipmentModalOpen(true);
            }}
            onDelete={handleRequestDelete}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEquipos.map((equipo) => (
              <EquipmentCard
                key={equipo.id}
                equipo={equipo}
                onSimulateHours={handleSimulateHours}
                onRegisterMaintenance={(e) => {
                  setEquipoForMaintenance(e);
                  setIsMaintenanceModalOpen(true);
                }}
                onViewHistory={(e) => {
                  setEquipoForHistory(e);
                  setIsHistoryModalOpen(true);
                }}
                onEdit={(e) => {
                  setEquipoToEdit(e);
                  setIsEquipmentModalOpen(true);
                }}
                onDelete={handleRequestDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>Mantenimiento Preventivo</p>
      </footer>

      {/* Modals */}
      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => {
          setIsEquipmentModalOpen(false);
          setEquipoToEdit(null);
        }}
        onSubmit={handleSaveEquipment}
        equipoToEdit={equipoToEdit}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setEquipoForMaintenance(null);
        }}
        onSubmit={handleRegisterMaintenance}
        equipo={equipoForMaintenance}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setEquipoForHistory(null);
        }}
        equipo={equipoForHistory}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEquipoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        equipo={equipoToDelete}
      />
    </div>
  );
}
export default App;
