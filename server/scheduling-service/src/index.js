const express = require('express');
const cors = require('cors');
require('dotenv').config();

const podologaRoutes = require('./routes/podologa.routes');
const tratamientoRoutes = require('./routes/tratamiento.routes');
const citaRoutes = require('./routes/cita.routes');
const consultaRoutes = require('./routes/consulta.routes');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/podologas', podologaRoutes);
app.use('/api/tratamientos', tratamientoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/consultas', consultaRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Microservicio de Agendamiento (Scheduling) OxiPie: ONLINE');
});

app.listen(PORT, () => {
  console.log(`✅ Servicio de Agendamiento corriendo en http://localhost:${PORT}`);
});