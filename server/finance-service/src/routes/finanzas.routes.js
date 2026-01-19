const express = require('express');
const router = express.Router();
const FinanzasController = require('../controllers/finanzas.controller');

// CRUD Egresos
router.post('/egresos', FinanzasController.crearEgreso);
router.get('/egresos', FinanzasController.obtenerEgresos);
router.delete('/egresos/:id', FinanzasController.borrarEgreso);

// Dashboard Unificado
router.get('/balance', FinanzasController.reporteBalance);

module.exports = router;