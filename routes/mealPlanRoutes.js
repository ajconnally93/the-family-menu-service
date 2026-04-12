const express = require('express');
const router = express.Router();

// Controllers
const {
  getMealPlans,
  createMealPlan,
  getMealPlanById,
  updateMealPlan
} = require('../controllers/mealPlanController');

// GET /api/meal-plans
router.get('/', getMealPlans);

// POST /api/meal-plans
router.post('/', createMealPlan);

// GET /api/meal-plans/:planId
router.get('/:planId', getMealPlanById);

// PUT /api/meal-plans/:planId
router.put('/:planId', updateMealPlan);

module.exports = router;