const express = require('express');
const cors = require('cors');
const path = require('path');
const mealRoutes = require('./routes/mealRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/meals', mealRoutes);

module.exports = app;