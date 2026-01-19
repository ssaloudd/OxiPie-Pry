const IngresosService = require('../services/ingresos.service');

const obtenerDashboard = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        // Si no envía fechas, calcula el histórico total
        const datos = await IngresosService.obtenerReporteIngresos(inicio, fin);
        res.json(datos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular ingresos' });
    }
};

module.exports = { obtenerDashboard };