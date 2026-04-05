const express = require('express');
const cors = require('cors');
const mealRoutes = require('./routes/mealRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/meals', mealRoutes);

module.exports = app;