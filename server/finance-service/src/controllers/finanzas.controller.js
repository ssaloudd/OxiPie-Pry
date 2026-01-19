const FinanzasService = require('../services/finanzas.service');

const crearEgreso = async (req, res) => {
    try {
        const egreso = await FinanzasService.registrarEgreso(req.body);
        res.status(201).json(egreso);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

const obtenerEgresos = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const egresos = await FinanzasService.listarEgresos(inicio, fin);
        res.json(egresos);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const borrarEgreso = async (req, res) => {
    try {
        await FinanzasService.eliminarEgreso(req.params.id);
        res.status(204).send();
    } catch (error) { res.status(400).json({ error: error.message }); }
};

const reporteBalance = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const balance = await FinanzasService.obtenerBalance(inicio, fin);
        res.json(balance);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { crearEgreso, obtenerEgresos, borrarEgreso, reporteBalance };