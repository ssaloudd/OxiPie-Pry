const ConsultaService = require('../services/consulta.service');

const obtenerTodas = async (req, res) => {
    try {
        const consultas = await ConsultaService.buscarTodas(req.query.fecha);
        res.json(consultas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerUna = async (req, res) => {
    try {
        const consulta = await ConsultaService.buscarPorId(req.params.id);
        if (!consulta) return res.status(404).json({ error: "Consulta no encontrada" });
        res.json(consulta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crear = async (req, res) => {
    try {
        const nueva = await ConsultaService.registrar(req.body);
        res.status(201).json(nueva);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const actualizar = async (req, res) => {
    try {
        const actualizada = await ConsultaService.actualizar(req.params.id, req.body);
        res.json(actualizada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const eliminar = async (req, res) => {
    try {
        await ConsultaService.eliminar(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { obtenerTodas, obtenerUna, crear, actualizar, eliminar };