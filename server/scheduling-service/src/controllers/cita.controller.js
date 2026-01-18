const CitaService = require('../services/cita.service');

const obtenerTodas = async (req, res) => {
    try {
        const { fecha, mes, id_pac, id_pod } = req.query;
        const citas = await CitaService.buscarTodas(fecha, mes, id_pac, id_pod);
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerUna = async (req, res) => {
    try {
        const cita = await CitaService.buscarPorId(req.params.id);
        if (!cita) return res.status(404).json({ error: "Cita no encontrada" });
        res.json(cita);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crear = async (req, res) => {
    try {
        const nueva = await CitaService.registrar(req.body);
        res.status(201).json(nueva);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const actualizar = async (req, res) => {
    try {
        const actualizada = await CitaService.actualizar(req.params.id, req.body);
        res.json(actualizada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const eliminar = async (req, res) => {
    try {
        await CitaService.eliminar(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { obtenerTodas, obtenerUna, crear, actualizar, eliminar };