const { PrismaClient } = require('../../../shared/node_modules/@prisma/client');
const prisma = new PrismaClient();

const buscarTodos = async () => {
  return await prisma.tratamiento.findMany({
    orderBy: { nombres_tra: 'asc' }
  });
};

const buscarPorId = async (id) => {
  return await prisma.tratamiento.findUnique({
    where: { id_tra: parseInt(id) }
  });
};

const registrar = async (datos) => {
  // Aseguramos que el precio sea un número flotante
  const precio = parseFloat(datos.precioBase_tra);
  
  return await prisma.tratamiento.create({
    data: {
        nombres_tra: datos.nombres_tra,
        descripcion_tra: datos.descripcion_tra || null,
        precioBase_tra: precio
    }
  });
};

const actualizar = async (id, datos) => {
  const dataToUpdate = { ...datos };
  
  // Si viene el precio, aseguramos que sea número
  if (dataToUpdate.precioBase_tra !== undefined) {
      dataToUpdate.precioBase_tra = parseFloat(dataToUpdate.precioBase_tra);
  }

  // Aseguramos que la descripción vacía se guarde como NULL
  if (dataToUpdate.descripcion_tra === '') {
    dataToUpdate.descripcion_tra = null;
  }
  
  // Eliminamos el ID si viene en el payload
  delete dataToUpdate.id_tra;

  return await prisma.tratamiento.update({
    where: { id_tra: parseInt(id) },
    data: dataToUpdate
  });
};

const eliminar = async (id) => {
  // Nota: En un futuro, si hay citas con este tratamiento, Prisma lanzará error de Foreign Key.
  // Eso es bueno para la integridad de datos.
  return await prisma.tratamiento.delete({
    where: { id_tra: parseInt(id) }
  });
};

module.exports = {
  buscarTodos,
  buscarPorId,
  registrar,
  actualizar,
  eliminar
};