const TratamientoService = require('../services/tratamiento.service');

const obtenerTodos = async (req, res) => {
  try {
    const tratamientos = await TratamientoService.buscarTodos();
    res.json(tratamientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tratamientos' });
  }
};

const obtenerUno = async (req, res) => {
  try {
    const tratamiento = await TratamientoService.buscarPorId(req.params.id);
    if (!tratamiento) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    res.json(tratamiento);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

const crear = async (req, res) => {
  try {
    let { nombres_tra, descripcion_tra, precioBase_tra } = req.body;

    if (!nombres_tra || precioBase_tra === undefined) {
      return res.status(400).json({
        error: 'Nombre y Precio Base son obligatorios'
      });
    }

    // Normalización de datos
    const data = {
      nombres_tra: nombres_tra.trim(),
      precioBase_tra: parseFloat(precioBase_tra),
      descripcion_tra:
        descripcion_tra && descripcion_tra.trim() !== ''
          ? descripcion_tra.trim()
          : null
    };

    const nuevo = await TratamientoService.registrar(data);
    res.status(201).json(nuevo);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear tratamiento' });
  }
};

const actualizar = async (req, res) => {
  try {
    const actualizado = await TratamientoService.actualizar(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await TratamientoService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) {
    // Error P2003 es violación de llave foránea en Prisma (si ya se usó en citas)
    if (error.code === 'P2003') {
        return res.status(409).json({ error: 'No se puede eliminar: El tratamiento ya ha sido usado en citas o consultas.' });
    }
    res.status(400).json({ error: error.message });
  }
};

module.exports = { obtenerTodos, obtenerUno, crear, actualizar, eliminar };