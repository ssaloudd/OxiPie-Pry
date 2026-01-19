const { PrismaClient } = require('../../../shared/node_modules/@prisma/client');
const prisma = new PrismaClient();

const obtenerReporteIngresos = async (fechaInicio, fechaFin) => {
    // Definir filtros de fecha (si no llegan, busca todo el historial)
    const whereFechaCon = {};
    const whereFechaCit = {};

    if (fechaInicio && fechaFin) {
        // Ajustar fechas para cubrir el día completo
        const start = new Date(fechaInicio);
        const end = new Date(new Date(fechaFin).setHours(23, 59, 59));

        whereFechaCon.fechaHora_con = { gte: start, lte: end };
        whereFechaCit.fechaHora_cit = { gte: start, lte: end };
    }

    // 1. Sumar Consultas (Solo las marcadas como pagadas)
    const sumaConsultas = await prisma.consulta.aggregate({
        _sum: {
            cantidadPagada_con: true
        },
        where: {
            pagado_con: true,
            ...whereFechaCon
        }
    });

    // 2. Sumar Citas (Solo las marcadas como pagadas)
    const sumaCitas = await prisma.cita.aggregate({
        _sum: {
            cantidadPagada_cit: true
        },
        where: {
            pagado_cit: true,
            ...whereFechaCit
        }
    });

    // Prisma devuelve objetos Decimal, los convertimos a Number para el JSON
    const totalConsultas = Number(sumaConsultas._sum.cantidadPagada_con || 0);
    const totalCitas = Number(sumaCitas._sum.cantidadPagada_cit || 0);
    const granTotal = totalConsultas + totalCitas;

    return {
        ingresosConsultas: totalConsultas,
        ingresosCitas: totalCitas,
        totalGeneral: granTotal
    };
};

module.exports = { obtenerReporteIngresos };