const { PrismaClient } = require('../../../shared/node_modules/@prisma/client');
const prisma = new PrismaClient();

const combinarFechaHora = (fechaStr, horaStr) => {
    if (!fechaStr || !horaStr) return null;
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const [horas, minutos] = horaStr.split(':').map(Number);
    return new Date(anio, mes - 1, dia, horas, minutos);
};

// --- FUNCIÓN DE VALIDACIÓN CRUZADA EN MEMORIA (CORREGIDA) ---
const verificarDisponibilidad = async (id_pod, inicio, fin, excluirConsultaId = null) => {
    if (!id_pod) return true;

    // 1. Definir los límites del DÍA EXACTO de la nueva cita
    const startOfDay = new Date(inicio);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(inicio);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Traer TODAS las actividades de ese podólogo EN ESE DÍA
    const citasDelDia = await prisma.cita.findMany({
        where: {
            id_pod: parseInt(id_pod),
            estado_cit: { not: 'cancelada' },
            fechaHora_cit: { gte: startOfDay, lte: endOfDay } // Filtro clave: Solo este día
        }
    });

    const consultasDelDia = await prisma.consulta.findMany({
        where: {
            id_pod: parseInt(id_pod),
            id_con: excluirConsultaId ? { not: parseInt(excluirConsultaId) } : undefined,
            estado_con: { not: 'cancelada' },
            fechaHora_con: { gte: startOfDay, lte: endOfDay } // Filtro clave: Solo este día
        }
    });

    // 3. Validar cruces en JavaScript (Infalible)
    // Helper para reconstruir la fecha fin de un evento existente
    const obtenerFechaFin = (fechaBase, horaFinObj) => {
        if (!horaFinObj) return new Date(fechaBase); 
        const f = new Date(fechaBase);
        f.setHours(horaFinObj.getHours(), horaFinObj.getMinutes(), 0, 0);
        return f;
    };

    const haySolapamiento = (inicioA, finA, inicioB, finB) => {
        return (inicioA < finB) && (finA > inicioB);
    };

    // Revisar contra Citas
    for (const cita of citasDelDia) {
        const citaFin = obtenerFechaFin(cita.fechaHora_cit, cita.horaFin_cit);
        if (haySolapamiento(inicio, fin, cita.fechaHora_cit, citaFin)) {
            return false; // Conflicto encontrado
        }
    }

    // Revisar contra Consultas
    for (const cons of consultasDelDia) {
        const consFin = obtenerFechaFin(cons.fechaHora_con, cons.horaFin_con);
        if (haySolapamiento(inicio, fin, cons.fechaHora_con, consFin)) {
            return false; // Conflicto encontrado
        }
    }

    return true; // Disponible
};

const buscarTodas = async (fechaFiltro) => {
  const where = {};
  if (fechaFiltro) {
    const [anio, mes, dia] = fechaFiltro.split('-').map(Number);
    const inicio = new Date(anio, mes - 1, dia, 0, 0, 0);
    const fin = new Date(anio, mes - 1, dia, 23, 59, 59);
    where.fechaHora_con = { gte: inicio, lte: fin };
  }

  return await prisma.consulta.findMany({
    where,
    include: { podologa: true, tratamientoSugerido: true },
    orderBy: { fechaHora_con: 'asc' }
  });
};

const buscarPorId = async (id) => {
    return await prisma.consulta.findUnique({
        where: { id_con: parseInt(id) },
        include: { podologa: true, tratamientoSugerido: true }
    });
};

const registrar = async (datos) => {
  const fechaInicio = combinarFechaHora(datos.fecha, datos.horaInicio);
  const fechaFin = combinarFechaHora(datos.fecha, datos.horaFin);

  if (!fechaInicio || !fechaFin) throw new Error("Fecha y horas inválidas");
  if (fechaFin <= fechaInicio) throw new Error("La hora fin debe ser mayor a la inicio");

  if (datos.id_pod) {
      const disponible = await verificarDisponibilidad(datos.id_pod, fechaInicio, fechaFin);
      if (!disponible) throw new Error("La especialista ya tiene una actividad (Cita o Consulta) en ese horario.");
  }

  const payload = {
    id_pac: parseInt(datos.id_pac),
    fechaHora_con: fechaInicio,
    horaInicio_con: fechaInicio,
    horaFin_con: fechaFin,
    motivoConsulta_con: datos.motivoConsulta_con,
    diagnostico_con: datos.diagnostico_con || null,
    estado_con: datos.estado_con || 'pendiente',
    precioSugerido_con: datos.precioSugerido_con ? parseFloat(datos.precioSugerido_con) : 0,
    cantidadPagada_con: datos.cantidadPagada_con ? parseFloat(datos.cantidadPagada_con) : 0,
    pagado_con: datos.pagado_con === true || datos.pagado_con === 'true',
    notasAdicionales_con: datos.notasAdicionales_con || null
  };

  if (datos.id_pod) payload.id_pod = parseInt(datos.id_pod);
  if (datos.id_tra_recomendado) payload.id_tra_recomendado = parseInt(datos.id_tra_recomendado);

  return await prisma.consulta.create({ data: payload });
};

const actualizar = async (id, datos) => {
    let fi, ff;
    if (datos.fecha && datos.horaInicio && datos.horaFin) {
        fi = combinarFechaHora(datos.fecha, datos.horaInicio);
        ff = combinarFechaHora(datos.fecha, datos.horaFin);
    }

    if ((fi && ff) || datos.id_pod) {
        if (datos.id_pod) {
            if (fi && ff) {
                 const disponible = await verificarDisponibilidad(datos.id_pod, fi, ff, id);
                 if (!disponible) throw new Error("Conflicto de horario con otra actividad.");
            }
        }
    }

    const dataToUpdate = {
        motivoConsulta_con: datos.motivoConsulta_con,
        diagnostico_con: datos.diagnostico_con,
        notasAdicionales_con: datos.notasAdicionales_con,
        estado_con: datos.estado_con,
        precioSugerido_con: datos.precioSugerido_con ? parseFloat(datos.precioSugerido_con) : undefined,
        cantidadPagada_con: datos.cantidadPagada_con ? parseFloat(datos.cantidadPagada_con) : undefined,
        pagado_con: datos.pagado_con !== undefined ? (datos.pagado_con === true || datos.pagado_con === 'true') : undefined
    };

    if (fi && ff) {
        dataToUpdate.fechaHora_con = fi;
        dataToUpdate.horaInicio_con = fi;
        dataToUpdate.horaFin_con = ff;
    }

    if (datos.id_pod !== undefined) {
        dataToUpdate.id_pod = datos.id_pod === "" ? null : parseInt(datos.id_pod);
    }
    
    if (datos.id_tra_recomendado !== undefined) {
        dataToUpdate.id_tra_recomendado = datos.id_tra_recomendado === "" ? null : parseInt(datos.id_tra_recomendado);
    }

    return await prisma.consulta.update({
        where: { id_con: parseInt(id) },
        data: dataToUpdate
    });
};

const eliminar = async (id) => {
    return await prisma.consulta.delete({ where: { id_con: parseInt(id) } });
};

module.exports = { buscarTodas, buscarPorId, registrar, actualizar, eliminar };