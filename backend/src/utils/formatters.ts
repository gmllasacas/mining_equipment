import { Equipo, TipoEquipo } from '@prisma/client';
import {
  calcularHorasEnCiclo,
  evaluarRequiereMantenimiento,
  obtenerIntervaloMantenimiento,
} from '../services/maintenanceRules';

export function formatearEquipo(equipo: Equipo) {
  const horometroNum = Number(equipo.horometro);
  const horometroUltimoMantenimientoNum = Number(equipo.horometroUltimoMantenimiento);
  const intervalo = obtenerIntervaloMantenimiento(equipo.tipo);
  const horasEnCiclo = calcularHorasEnCiclo(horometroNum, horometroUltimoMantenimientoNum);
  const requiereMantenimiento = evaluarRequiereMantenimiento(equipo.tipo, horasEnCiclo);

  return {
    id: equipo.id,
    codigo: equipo.codigo,
    tipo: equipo.tipo,
    horometro: horometroNum,
    horometro_ultimo_mantenimiento: horometroUltimoMantenimientoNum,
    intervalo_mantenimiento: intervalo,
    horas_en_ciclo: horasEnCiclo,
    alerta_preventiva: horasEnCiclo >= intervalo * 0.8 && !requiereMantenimiento,
    requiere_mantenimiento: requiereMantenimiento,
    created_at: equipo.createdAt.toISOString(),
    updated_at: equipo.updatedAt.toISOString(),
  };
}

