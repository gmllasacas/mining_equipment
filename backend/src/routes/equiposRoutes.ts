import { Router } from 'express';
import {
  listarEquipos,
  obtenerEquipoPorId,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo,
} from '../controllers/equiposController';
import {
  registrarMantenimiento,
  listarMantenimientosPorEquipo,
} from '../controllers/mantenimientosController';

const router = Router();

// Endpoints de gestión de equipos
router.get('/', listarEquipos);
router.post('/', crearEquipo);
router.get('/:id', obtenerEquipoPorId);
router.put('/:id', actualizarEquipo);
router.delete('/:id', eliminarEquipo);

// Endpoints de mantenimientos por equipo
router.post('/:id/mantenimientos', registrarMantenimiento);
router.get('/:id/mantenimientos', listarMantenimientosPorEquipo);

export default router;

