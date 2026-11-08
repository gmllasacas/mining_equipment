import { Request, Response } from 'express';
import { TipoEquipo } from '@prisma/client';
import { prisma } from '../prisma';
import { formatearEquipo } from '../utils/formatters';
import {
  validarHorometroConsistente,
  INTERVALOS_MANTENIMIENTO,
} from '../services/maintenanceRules';

export async function listarEquipos(req: Request, res: Response) {
  try {
    const equipos = await prisma.equipo.findMany({
      orderBy: { id: 'asc' },
    });

    const equiposFormateados = equipos.map(formatearEquipo);
    return res.status(200).json(equiposFormateados);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al consultar los equipos',
      details: error instanceof Error ? error.message : null,
    });
  }
}

export async function obtenerEquipoPorId(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: true,
        message: 'El identificador de equipo debe ser un número entero válido',
        details: null,
      });
    }

    const equipo = await prisma.equipo.findUnique({
      where: { id },
      include: {
        mantenimientos: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!equipo) {
      return res.status(404).json({
        error: true,
        message: `Equipo con ID ${id} no encontrado`,
        details: null,
      });
    }

    const equipoFormateado = formatearEquipo(equipo);

    return res.status(200).json({
      ...equipoFormateado,
      mantenimientos: equipo.mantenimientos.map((m) => ({
        id: m.id,
        equipo_id: m.equipoId,
        fecha: m.fecha.toISOString(),
        horometro_servicio: Number(m.horometroServicio),
        descripcion: m.descripcion,
        tecnico: m.tecnico,
        created_at: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al obtener el detalle del equipo',
      details: error instanceof Error ? error.message : null,
    });
  }
}

export async function crearEquipo(req: Request, res: Response) {
  try {
    const { codigo, tipo, horometro } = req.body;

    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'El código del equipo es obligatorio y debe ser una cadena no vacía',
        details: null,
      });
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    if (!tipo || !(tipo in INTERVALOS_MANTENIMIENTO)) {
      return res.status(400).json({
        error: true,
        message: `El tipo de equipo no es válido. Tipos aceptados: ${Object.keys(
          INTERVALOS_MANTENIMIENTO
        ).join(', ')}`,
        details: null,
      });
    }

    const horometroNum = horometro !== undefined ? parseFloat(horometro) : 0.0;
    if (isNaN(horometroNum) || horometroNum < 0) {
      return res.status(400).json({
        error: true,
        message: 'El horómetro debe ser un número igual o mayor a cero',
        details: null,
      });
    }

    // Verificar unicidad de código
    const existente = await prisma.equipo.findUnique({
      where: { codigo: codigoNormalizado },
    });

    if (existente) {
      return res.status(409).json({
        error: true,
        message: `Ya existe un equipo registrado con el código "${codigoNormalizado}"`,
        details: null,
      });
    }

    const nuevoEquipo = await prisma.equipo.create({
      data: {
        codigo: codigoNormalizado,
        tipo: tipo as TipoEquipo,
        horometro: horometroNum,
        horometroUltimoMantenimiento: 0.0,
      },
    });

    return res.status(201).json(formatearEquipo(nuevoEquipo));
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al registrar el nuevo equipo',
      details: error instanceof Error ? error.message : null,
    });
  }
}

export async function actualizarEquipo(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: true,
        message: 'El identificador de equipo debe ser un número entero válido',
        details: null,
      });
    }

    const equipoActual = await prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoActual) {
      return res.status(404).json({
        error: true,
        message: `Equipo con ID ${id} no encontrado`,
        details: null,
      });
    }

    const { codigo, tipo, horometro } = req.body;
    const datosActualizacion: {
      codigo?: string;
      tipo?: TipoEquipo;
      horometro?: number;
    } = {};

    if (codigo !== undefined) {
      if (typeof codigo !== 'string' || codigo.trim() === '') {
        return res.status(400).json({
          error: true,
          message: 'El código de equipo no puede ser vacío',
          details: null,
        });
      }
      const codigoNormalizado = codigo.trim().toUpperCase();
      if (codigoNormalizado !== equipoActual.codigo) {
        const duplicado = await prisma.equipo.findUnique({
          where: { codigo: codigoNormalizado },
        });
        if (duplicado) {
          return res.status(409).json({
            error: true,
            message: `El código "${codigoNormalizado}" ya pertenece a otro equipo`,
            details: null,
          });
        }
        datosActualizacion.codigo = codigoNormalizado;
      }
    }

    if (tipo !== undefined) {
      if (!(tipo in INTERVALOS_MANTENIMIENTO)) {
        return res.status(400).json({
          error: true,
          message: `El tipo de equipo no es válido. Tipos aceptados: ${Object.keys(
            INTERVALOS_MANTENIMIENTO
          ).join(', ')}`,
          details: null,
        });
      }
      datosActualizacion.tipo = tipo as TipoEquipo;
    }

    if (horometro !== undefined) {
      const nuevoHorometro = parseFloat(horometro);
      if (isNaN(nuevoHorometro) || nuevoHorometro < 0) {
        return res.status(400).json({
          error: true,
          message: 'El horómetro debe ser un número numérico igual o mayor a cero',
          details: null,
        });
      }

      // Regla de consistencia: el nuevo horómetro no puede ser menor al del último mantenimiento
      const horometroUltimoMantenimiento = Number(equipoActual.horometroUltimoMantenimiento);
      if (!validarHorometroConsistente(nuevoHorometro, horometroUltimoMantenimiento)) {
        return res.status(400).json({
          error: true,
          message: `El horómetro (${nuevoHorometro}h) no puede ser inferior al horómetro del último mantenimiento (${horometroUltimoMantenimiento}h)`,
          details: null,
        });
      }

      datosActualizacion.horometro = nuevoHorometro;
    }

    const equipoActualizado = await prisma.equipo.update({
      where: { id },
      data: datosActualizacion,
    });

    return res.status(200).json(formatearEquipo(equipoActualizado));
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al actualizar el equipo',
      details: error instanceof Error ? error.message : null,
    });
  }
}

export async function eliminarEquipo(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: true,
        message: 'El identificador de equipo debe ser un número entero válido',
        details: null,
      });
    }

    const equipo = await prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipo) {
      return res.status(404).json({
        error: true,
        message: `Equipo con ID ${id} no encontrado`,
        details: null,
      });
    }

    await prisma.equipo.delete({
      where: { id },
    });

    return res.status(200).json({
      error: false,
      message: `Equipo ${equipo.codigo} eliminado exitosamente con su historial asociado`,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al eliminar el equipo',
      details: error instanceof Error ? error.message : null,
    });
  }
}

