const express = require('express');
const cors = require('cors');
require('dotenv').config();

// IMPORTANTE: Ahora usamos las rutas unificadas de finanzas
const finanzasRoutes = require('./routes/finanzas.routes');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

// IMPORTANTE: La ruta base debe ser /api/finanzas
app.use('/api/finanzas', finanzasRoutes);

app.listen(PORT, () => {
  console.log(`💰 Servicio de Finanzas corriendo en http://localhost:${PORT}`);
});