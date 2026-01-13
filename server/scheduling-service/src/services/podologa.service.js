const { PrismaClient } = require('../../../shared/node_modules/@prisma/client');
const prisma = new PrismaClient();

const buscarTodas = async () => {
  return await prisma.podologa.findMany({
    orderBy: { apellidos_pod: 'asc' }
  });
};

const buscarPorId = async (id) => {
  return await prisma.podologa.findUnique({
    where: { id_pod: parseInt(id) }
  });
};

const buscarPorCedula = async (cedula) => {
  return await prisma.podologa.findUnique({
    where: { cedula_pod: cedula }
  });
};

// Validar correo único
const buscarPorEmail = async (email) => {
    if (!email) return null;
    return await prisma.podologa.findUnique({
        where: { email_pod: email }
    });
};

const registrar = async (datos) => {
  // 1. Validar Cédula única
  const existeCedula = await buscarPorCedula(datos.cedula_pod);
  if (existeCedula) throw new Error(`La cédula ${datos.cedula_pod} ya está registrada.`);

  // 2. Validar Email único (si viene lleno)
  if (datos.email_pod && datos.email_pod.trim() !== "") {
      const existeEmail = await buscarPorEmail(datos.email_pod);
      if (existeEmail) throw new Error(`El correo ${datos.email_pod} ya está registrado.`);
  }

  // 3. Preparar datos (convertir fechas y limpiar vacíos)
  const datosLimpios = {
      nombres_pod: datos.nombres_pod,
      apellidos_pod: datos.apellidos_pod,
      cedula_pod: datos.cedula_pod,
      genero_pod: datos.genero_pod,
      // Si envían string vacío, guardamos null para no chocar con Unique
      telefono_pod: datos.telefono_pod || null,
      direccion_pod: datos.direccion_pod || null,
      email_pod: datos.email_pod || null, 
      // Si viene fecha, la convertimos, si no, null
      fechaNac_pod: datos.fechaNac_pod ? new Date(datos.fechaNac_pod) : null
  };
  
  return await prisma.podologa.create({ data: datosLimpios });
};

const actualizar = async (id, datos) => {
  // Verificar que el ID sea entero
  const idPod = parseInt(id);

  // Validaciones de unicidad en edición (excluyendo al usuario actual)
  if (datos.cedula_pod) {
      const existe = await buscarPorCedula(datos.cedula_pod);
      if (existe && existe.id_pod !== idPod) throw new Error(`La cédula ${datos.cedula_pod} pertenece a otra persona.`);
  }

  if (datos.email_pod) {
      const existe = await buscarPorEmail(datos.email_pod);
      if (existe && existe.id_pod !== idPod) throw new Error(`El correo ${datos.email_pod} pertenece a otra persona.`);
  }

  const datosLimpios = { ...datos };
  
  // Limpieza de campos
  if (datos.fechaNac_pod) datosLimpios.fechaNac_pod = new Date(datos.fechaNac_pod);
  if (datos.email_pod === "") datosLimpios.email_pod = null;
  if (datos.telefono_pod === "") datosLimpios.telefono_pod = null;
  if (datos.direccion_pod === "") datosLimpios.direccion_pod = null;
  
  // Eliminar ID del objeto de actualización
  delete datosLimpios.id_pod;

  return await prisma.podologa.update({
    where: { id_pod: idPod },
    data: datosLimpios
  });
};

const eliminar = async (id) => {
    // Validar dependencias (Citas/Consultas) en el futuro
    return await prisma.podologa.delete({
        where: { id_pod: parseInt(id) }
    });
};

module.exports = {
  buscarTodas, buscarPorId, registrar, actualizar, eliminar
};