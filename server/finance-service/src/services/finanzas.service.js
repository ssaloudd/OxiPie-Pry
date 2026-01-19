const { PrismaClient } = require('../../../shared/node_modules/@prisma/client');
const prisma = new PrismaClient();

// === 1. CRUD EGRESOS ===

const registrarEgreso = async (datos) => {
    return await prisma.egresos.create({
        data: {
            monto_egr: parseFloat(datos.monto_egr),
            motivo_egr: datos.motivo_egr,
            fecha_egr: new Date(datos.fecha_egr),
            id_pod: parseInt(datos.id_pod)
        }
    });
};

const listarEgresos = async (fechaInicio, fechaFin) => {
    const where = {};
    if (fechaInicio && fechaFin) {
        const start = new Date(fechaInicio);
        const end = new Date(new Date(fechaFin).setHours(23, 59, 59));
        where.fecha_egr = { gte: start, lte: end };
    }

    return await prisma.egresos.findMany({
        where,
        include: { podologa: true },
        orderBy: { fecha_egr: 'desc' }
    });
};

const eliminarEgreso = async (id) => {
    return await prisma.egresos.delete({ where: { id_egr: parseInt(id) } });
};

// === 2. BALANCE GENERAL (Dashboard) ===

const obtenerBalance = async (fechaInicio, fechaFin) => {
    const whereFechaCon = {};
    const whereFechaCit = {};
    const whereFechaEgr = {};

    if (fechaInicio && fechaFin) {
        const start = new Date(fechaInicio);
        const end = new Date(new Date(fechaFin).setHours(23, 59, 59));
        
        whereFechaCon.fechaHora_con = { gte: start, lte: end };
        whereFechaCit.fechaHora_cit = { gte: start, lte: end };
        whereFechaEgr.fecha_egr = { gte: start, lte: end };
    }

    // A. Sumar Ingresos (Consultas)
    const sumaConsultas = await prisma.consulta.aggregate({
        _sum: { cantidadPagada_con: true },
        where: { pagado_con: true, ...whereFechaCon }
    });

    // B. Sumar Ingresos (Citas)
    const sumaCitas = await prisma.cita.aggregate({
        _sum: { cantidadPagada_cit: true },
        where: { pagado_cit: true, ...whereFechaCit }
    });

    // C. Sumar Egresos
    const sumaEgresos = await prisma.egresos.aggregate({
        _sum: { monto_egr: true },
        where: { ...whereFechaEgr }
    });

    const totalConsultas = Number(sumaConsultas._sum.cantidadPagada_con || 0);
    const totalCitas = Number(sumaCitas._sum.cantidadPagada_cit || 0);
    const totalIngresos = totalConsultas + totalCitas;
    const totalEgresos = Number(sumaEgresos._sum.monto_egr || 0);

    return {
        ingresos: {
            total: totalIngresos,
            consultas: totalConsultas,
            citas: totalCitas
        },
        egresos: totalEgresos,
        utilidad: totalIngresos - totalEgresos
    };
};

module.exports = { registrarEgreso, listarEgresos, eliminarEgreso, obtenerBalance };