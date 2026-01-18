const { PrismaClient } = require('../../../shared/node_modules/@prisma/client');
const prisma = new PrismaClient();

const combinarFechaHora = (fechaStr, horaStr) => {
    if (!fechaStr || !horaStr) return null;
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const [horas, minutos] = horaStr.split(':').map(Number);
    return new Date(anio, mes - 1, dia, horas, minutos);
};

// --- FUNCIÓN DE VALIDACIÓN CRUZADA EN MEMORIA (CORREGIDA) ---
const verificarDisponibilidad = async (id_pod, inicio, fin, excluirCitaId = null) => {
    if (!id_pod) return true;

    // 1. Límites del día
    const startOfDay = new Date(inicio);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(inicio);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Traer actividades del día
    const citasDelDia = await prisma.cita.findMany({
        where: {
            id_pod: parseInt(id_pod),
            id_cit: excluirCitaId ? { not: parseInt(excluirCitaId) } : undefined,
            estado_cit: { not: 'cancelada' },
            fechaHora_cit: { gte: startOfDay, lte: endOfDay }
        }
    });

    const consultasDelDia = await prisma.consulta.findMany({
        where: {
            id_pod: parseInt(id_pod),
            estado_con: { not: 'cancelada' },
            fechaHora_con: { gte: startOfDay, lte: endOfDay }
        }
    });

    // 3. Validar JS
    const obtenerFechaFin = (fechaBase, horaFinObj) => {
        if (!horaFinObj) return new Date(fechaBase);
        const f = new Date(fechaBase);
        f.setHours(horaFinObj.getHours(), horaFinObj.getMinutes(), 0, 0);
        return f;
    };

    const haySolapamiento = (inicioA, finA, inicioB, finB) => {
        return (inicioA < finB) && (finA > inicioB);
    };

    for (const cita of citasDelDia) {
        const citaFin = obtenerFechaFin(cita.fechaHora_cit, cita.horaFin_cit);
        if (haySolapamiento(inicio, fin, cita.fechaHora_cit, citaFin)) return false;
    }

    for (const cons of consultasDelDia) {
        const consFin = obtenerFechaFin(cons.fechaHora_con, cons.horaFin_con);
        if (haySolapamiento(inicio, fin, cons.fechaHora_con, consFin)) return false;
    }

    return true;
};

const buscarTodas = async (fecha, mes, id_pac, id_pod) => {
  const where = {};

  // Filtro 1: Fecha Exacta (Prioridad alta)
  if (fecha) {
    const [anio, m, dia] = fecha.split('-').map(Number);
    const inicio = new Date(anio, m - 1, dia, 0, 0, 0);
    const fin = new Date(anio, m - 1, dia, 23, 59, 59);
    where.fechaHora_cit = { gte: inicio, lte: fin };
  } 
  // Filtro 2: Mes Completo (Para llenar el calendario con círculos)
  else if (mes) {
     // mes viene como "2026-01"
     const [anio, m] = mes.split('-').map(Number);
     // Primer día del mes
     const inicio = new Date(anio, m - 1, 1, 0, 0, 0);
     // Último día del mes (truco: día 0 del siguiente mes)
     const fin = new Date(anio, m, 0, 23, 59, 59);
     where.fechaHora_cit = { gte: inicio, lte: fin };
  }

  // Filtro 3: Paciente
  if (id_pac) {
      where.id_pac = parseInt(id_pac);
  }

  // Filtro 4: Podóloga
  if (id_pod) {
      where.id_pod = parseInt(id_pod);
  }

  // Excluir canceladas si se desea, o dejarlas para historial. 
  // Dejémoslas para que se vean pero tachadas (eso se maneja en front).

  return await prisma.cita.findMany({
    where,
    include: { tratamiento: true, podologa: true },
    orderBy: { fechaHora_cit: 'asc' }
  });
};

const buscarPorId = async (id) => {
    return await prisma.cita.findUnique({
        where: { id_cit: parseInt(id) },
        include: { tratamiento: true, podologa: true }
    });
};

const registrar = async (datos) => {
  const fechaInicio = combinarFechaHora(datos.fecha, datos.horaInicio);
  const fechaFin = combinarFechaHora(datos.fecha, datos.horaFin);

  if (!fechaInicio || !fechaFin) throw new Error("Fecha y horas inválidas");
  if (fechaFin <= fechaInicio) throw new Error("La hora de fin debe ser posterior a la de inicio");

  if (datos.id_pod && datos.id_pod !== "") {
    const disponible = await verificarDisponibilidad(datos.id_pod, fechaInicio, fechaFin);
    if (!disponible) throw new Error("La especialista ya tiene una actividad (Cita o Consulta) en ese horario.");
  }

  const payload = {
    id_pac: parseInt(datos.id_pac),
    id_tra: parseInt(datos.id_tra),
    id_con_origen: datos.id_con_origen ? parseInt(datos.id_con_origen) : null,
    fechaHora_cit: fechaInicio,
    horaInicio_cit: fechaInicio, 
    horaFin_cit: fechaFin,       
    precioAcordado_cit: parseFloat(datos.precioAcordado_cit),
    notasAdicionales_cit: datos.notasAdicionales_cit || "",
    estado_cit: 'pendiente'
  };

  if (datos.id_pod && datos.id_pod !== "") {
    payload.id_pod = parseInt(datos.id_pod);
  }

  return await prisma.cita.create({ data: payload });
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
        notasAdicionales_cit: datos.notasAdicionales_cit,
        precioAcordado_cit: datos.precioAcordado_cit ? parseFloat(datos.precioAcordado_cit) : undefined,
        estado_cit: datos.estado_cit
    };

    if (fi && ff) {
        dataToUpdate.fechaHora_cit = fi;
        dataToUpdate.horaInicio_cit = fi;
        dataToUpdate.horaFin_cit = ff;
    }

    if (datos.id_pod !== undefined) {
        dataToUpdate.id_pod = datos.id_pod === "" ? null : parseInt(datos.id_pod);
    }

    return await prisma.cita.update({
        where: { id_cit: parseInt(id) },
        data: dataToUpdate
    });
};

const eliminar = async (id) => {
    return await prisma.cita.delete({ where: { id_cit: parseInt(id) } });
};

module.exports = { buscarTodas, buscarPorId, registrar, actualizar, eliminar };