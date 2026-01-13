const express = require('express');
const router = express.Router();
const CitaController = require('../controllers/cita.controller');

router.get('/', CitaController.obtenerTodas);
router.get('/:id', CitaController.obtenerUna);
router.post('/', CitaController.crear);
router.put('/:id', CitaController.actualizar);
router.delete('/:id', CitaController.eliminar);

module.exports = router;