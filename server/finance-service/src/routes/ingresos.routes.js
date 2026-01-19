const express = require('express');
const router = express.Router();
const IngresosController = require('../controllers/ingresos.controller');

router.get('/dashboard', IngresosController.obtenerDashboard);

module.exports = router;