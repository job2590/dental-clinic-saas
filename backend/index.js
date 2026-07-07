require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta principal (Healthcheck)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Dental Clinic Amanecer SaaS API is running!',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
