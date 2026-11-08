export type TipoEquipo = 'camion' | 'excavadora' | 'perforadora';

export const INTERVALOS_MANTENIMIENTO: Record<TipoEquipo, number> = {
  camion: 500,
  excavadora: 250,
  perforadora: 300,
};

export function obtenerIntervaloMantenimiento(tipo: TipoEquipo | string): number {
  const intervalo = INTERVALOS_MANTENIMIENTO[tipo as TipoEquipo];
  if (!intervalo) {
    throw new Error(`Tipo de equipo no válido: "${tipo}". Tipos permitidos: camion, excavadora, perforadora.`);
  }
  return intervalo;
}

export function calcularHorasEnCiclo(
  horometro: number,
  horometroUltimoMantenimiento: number
): number {
  if (horometro < horometroUltimoMantenimiento) {
    throw new Error('El horómetro acumulado no puede ser menor al horómetro del último mantenimiento.');
  }
  return Number((horometro - horometroUltimoMantenimiento).toFixed(2));
}

export function evaluarRequiereMantenimiento(
  tipo: TipoEquipo | string,
  horasEnCiclo: number
): boolean {
  const intervalo = obtenerIntervaloMantenimiento(tipo);
  return horasEnCiclo >= intervalo;
}

export function validarHorometroConsistente(
  nuevoHorometro: number,
  horometroUltimoMantenimiento: number
): boolean {
  return nuevoHorometro >= horometroUltimoMantenimiento;
}

export function calcularReinicioCiclo(horometro: number) {
  return {
    horometroUltimoMantenimiento: horometro,
    horasEnCiclo: 0,
    requiereMantenimiento: false,
  };
}

