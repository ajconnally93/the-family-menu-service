const express = require('express');
const cors = require('cors');
const path = require('path');
const mealRoutes = require('./routes/mealRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/meals', mealRoutes);
app.use('/api/meal-plans', mealPlanRoutes);

module.exports = app;