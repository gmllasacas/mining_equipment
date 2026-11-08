import { describe, it, expect } from 'vitest';
import {
  calcularHorasEnCiclo,
  obtenerIntervaloMantenimiento,
  evaluarRequiereMantenimiento,
  validarHorometroConsistente,
  calcularReinicioCiclo,
  INTERVALOS_MANTENIMIENTO,
} from '../../src/services/maintenanceRules';

describe('Reglas de Negocio de Mantenimiento (Lógica Pura de Dominio)', () => {
  describe('1. Intervalos de Mantenimiento por Tipo de Maquinaria', () => {
    it('debe definir 500 horas para camión', () => {
      expect(obtenerIntervaloMantenimiento('camion')).toBe(500);
      expect(INTERVALOS_MANTENIMIENTO.camion).toBe(500);
    });

    it('debe definir 250 horas para excavadora', () => {
      expect(obtenerIntervaloMantenimiento('excavadora')).toBe(250);
      expect(INTERVALOS_MANTENIMIENTO.excavadora).toBe(250);
    });

    it('debe definir 300 horas para perforadora', () => {
      expect(obtenerIntervaloMantenimiento('perforadora')).toBe(300);
      expect(INTERVALOS_MANTENIMIENTO.perforadora).toBe(300);
    });

    it('debe lanzar error ante tipos de maquinaria no reconocidos', () => {
      expect(() => obtenerIntervaloMantenimiento('grua')).toThrowError(
        /Tipo de equipo no válido/
      );
    });
  });

  describe('2. Cálculo de Horas en Ciclo Operativo', () => {
    it('debe calcular correctamente las horas transcurridas en el ciclo actual', () => {
      const horas = calcularHorasEnCiclo(275.5, 250.0);
      expect(horas).toBe(25.5);
    });

    it('debe manejar adecuadamente horómetros iniciales en cero', () => {
      const horas = calcularHorasEnCiclo(0, 0);
      expect(horas).toBe(0);
    });

    it('debe calcular horas cuando el último mantenimiento fue en 0', () => {
      const horas = calcularHorasEnCiclo(150.0, 0);
      expect(horas).toBe(150.0);
    });

    it('debe lanzar error si el horómetro actual es menor al del último mantenimiento', () => {
      expect(() => calcularHorasEnCiclo(200.0, 250.0)).toThrowError(
        /no puede ser menor al horómetro del último mantenimiento/
      );
    });
  });

  describe('3. Evaluación de Alerta de Mantenimiento Requerido', () => {
    it('debe retornar true cuando las horas en ciclo igualan exactamente el umbral', () => {
      expect(evaluarRequiereMantenimiento('camion', 500)).toBe(true);
      expect(evaluarRequiereMantenimiento('excavadora', 250)).toBe(true);
      expect(evaluarRequiereMantenimiento('perforadora', 300)).toBe(true);
    });

    it('debe retornar true cuando las horas en ciclo superan el umbral establecido', () => {
      expect(evaluarRequiereMantenimiento('camion', 520.5)).toBe(true);
      expect(evaluarRequiereMantenimiento('excavadora', 260)).toBe(true);
      expect(evaluarRequiereMantenimiento('perforadora', 315)).toBe(true);
    });

    it('debe retornar false cuando las horas en ciclo están por debajo del umbral', () => {
      expect(evaluarRequiereMantenimiento('camion', 499.9)).toBe(false);
      expect(evaluarRequiereMantenimiento('excavadora', 249)).toBe(false);
      expect(evaluarRequiereMantenimiento('perforadora', 299)).toBe(false);
    });

    it('debe retornar false con horas en ciclo en cero tras mantenimiento', () => {
      expect(evaluarRequiereMantenimiento('camion', 0)).toBe(false);
    });
  });

  describe('4. Validación de Consistencia de Horómetro', () => {
    it('debe aceptar lecturas de horómetro superiores o iguales al último mantenimiento', () => {
      expect(validarHorometroConsistente(300, 250)).toBe(true);
      expect(validarHorometroConsistente(250, 250)).toBe(true);
    });

    it('debe rechazar lecturas de horómetro menores al último mantenimiento registrado', () => {
      expect(validarHorometroConsistente(249.9, 250)).toBe(false);
    });
  });

  describe('5. Reinicio de Ciclo Operativo', () => {
    it('debe actualizar la base de mantenimiento a la lectura actual y reiniciar las horas en ciclo', () => {
      const resultado = calcularReinicioCiclo(520.0);
      expect(resultado).toEqual({
        horometroUltimoMantenimiento: 520.0,
        horasEnCiclo: 0,
        requiereMantenimiento: false,
      });
    });
  });
});

