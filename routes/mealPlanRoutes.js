const express = require('express');
const router = express.Router();

// Controllers
const {
  getMealPlans,
  createMealPlan,
  getMealPlanById,
  updateMealPlan,
  addMealToPlan,
  removeMealFromPlan
} = require('../controllers/mealPlanController');

router.get('/', getMealPlans);
router.post('/', createMealPlan);
router.get('/:planId', getMealPlanById);
router.put('/:planId', updateMealPlan);
router.post('/:planId/meals', addMealToPlan);
router.delete('/:planId/meals/:mealId', removeMealFromPlan);

module.exports = router;