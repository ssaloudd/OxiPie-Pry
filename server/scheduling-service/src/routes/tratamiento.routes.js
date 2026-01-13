const express = require('express');
const router = express.Router();
const TratamientoController = require('../controllers/tratamiento.controller');

router.get('/', TratamientoController.obtenerTodos);
router.get('/:id', TratamientoController.obtenerUno);
router.post('/', TratamientoController.crear);
router.put('/:id', TratamientoController.actualizar);
router.delete('/:id', TratamientoController.eliminar);

module.exports = router;