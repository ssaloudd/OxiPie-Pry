const express = require('express');
const router = express.Router();
const ConsultaController = require('../controllers/consulta.controller');

router.get('/', ConsultaController.obtenerTodas);
router.get('/:id', ConsultaController.obtenerUna);
router.post('/', ConsultaController.crear);
router.put('/:id', ConsultaController.actualizar);
router.delete('/:id', ConsultaController.eliminar);

module.exports = router;