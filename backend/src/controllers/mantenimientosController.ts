import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { formatearEquipo } from '../utils/formatters';

export async function registrarMantenimiento(req: Request, res: Response) {
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

    const { descripcion, tecnico } = req.body;

    // Transacción atómica: registro de historial + reinicio del ciclo operativo
    const [nuevoMantenimiento, equipoActualizado] = await prisma.$transaction([
      prisma.mantenimiento.create({
        data: {
          equipoId: equipo.id,
          horometroServicio: equipo.horometro,
          descripcion: typeof descripcion === 'string' && descripcion.trim() !== '' ? descripcion.trim() : null,
          tecnico: typeof tecnico === 'string' && tecnico.trim() !== '' ? tecnico.trim() : null,
        },
      }),
      prisma.equipo.update({
        where: { id: equipo.id },
        data: {
          horometroUltimoMantenimiento: equipo.horometro,
        },
      }),
    ]);

    return res.status(201).json({
      error: false,
      message: 'Mantenimiento registrado y ciclo de servicio reiniciado exitosamente',
      mantenimiento: {
        id: nuevoMantenimiento.id,
        equipo_id: nuevoMantenimiento.equipoId,
        fecha: nuevoMantenimiento.fecha.toISOString(),
        horometro_servicio: Number(nuevoMantenimiento.horometroServicio),
        descripcion: nuevoMantenimiento.descripcion,
        tecnico: nuevoMantenimiento.tecnico,
        created_at: nuevoMantenimiento.createdAt.toISOString(),
      },
      equipo: formatearEquipo(equipoActualizado),
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al registrar el mantenimiento',
      details: error instanceof Error ? error.message : null,
    });
  }
}

export async function listarMantenimientosPorEquipo(req: Request, res: Response) {
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

    const mantenimientos = await prisma.mantenimiento.findMany({
      where: { equipoId: id },
      orderBy: { fecha: 'desc' },
    });

    return res.status(200).json(
      mantenimientos.map((m) => ({
        id: m.id,
        equipo_id: m.equipoId,
        fecha: m.fecha.toISOString(),
        horometro_servicio: Number(m.horometroServicio),
        descripcion: m.descripcion,
        tecnico: m.tecnico,
        created_at: m.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error interno al consultar el historial de mantenimientos',
      details: error instanceof Error ? error.message : null,
    });
  }
}

