const express = require('express');
const cors = require('cors');
const path = require('path');
const mealRoutes = require('./routes/mealRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/meals', mealRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong.'
    }
  });
});

module.exports = app;