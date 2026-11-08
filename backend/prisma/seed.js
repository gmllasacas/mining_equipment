"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_process_1 = __importDefault(require("node:process"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Iniciando sembrado de datos...');
    // Limpiar registros previos
    await prisma.mantenimiento.deleteMany();
    await prisma.equipo.deleteMany();
    // 1. CAM-101 (Operativo: 150 / 500 hrs)
    await prisma.equipo.create({
        data: {
            codigo: 'CAM-101',
            tipo: client_1.TipoEquipo.camion,
            horometro: 150.0,
            horometroUltimoMantenimiento: 0.0,
        },
    });
    // 2. CAM-102 (Requiere mantenimiento: 520 >= 500 hrs)
    await prisma.equipo.create({
        data: {
            codigo: 'CAM-102',
            tipo: client_1.TipoEquipo.camion,
            horometro: 520.0,
            horometroUltimoMantenimiento: 0.0,
        },
    });
    // 3. EXC-201 (Operativo: 25 / 250 hrs tras servicio previo en 250h)
    const exc201 = await prisma.equipo.create({
        data: {
            codigo: 'EXC-201',
            tipo: client_1.TipoEquipo.excavadora,
            horometro: 275.0,
            horometroUltimoMantenimiento: 250.0,
        },
    });
    await prisma.mantenimiento.create({
        data: {
            equipoId: exc201.id,
            horometroServicio: 250.0,
            descripcion: 'Mantenimiento preventivo programado de 250 horas',
            tecnico: 'Carlos Pérez',
            fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // hace 7 días
        },
    });
    // 4. EXC-202 (Requiere mantenimiento: 260 >= 250 hrs)
    await prisma.equipo.create({
        data: {
            codigo: 'EXC-202',
            tipo: client_1.TipoEquipo.excavadora,
            horometro: 260.0,
            horometroUltimoMantenimiento: 0.0,
        },
    });
    // 5. PER-301 (Requiere mantenimiento: 315 >= 300 hrs)
    await prisma.equipo.create({
        data: {
            codigo: 'PER-301',
            tipo: client_1.TipoEquipo.perforadora,
            horometro: 315.0,
            horometroUltimoMantenimiento: 0.0,
        },
    });
    // 6. PER-302 (Operativo: 80 / 300 hrs)
    await prisma.equipo.create({
        data: {
            codigo: 'PER-302',
            tipo: client_1.TipoEquipo.perforadora,
            horometro: 80.0,
            horometroUltimoMantenimiento: 0.0,
        },
    });
    console.log('Sembrado de datos completado exitosamente con 6 equipos y 1 mantenimiento histórico.');
}
main()
    .catch((e) => {
    console.error('Error durante el sembrado de datos:', e);
    node_process_1.default.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
