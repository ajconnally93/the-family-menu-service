const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');

router.get('/', mealController.getMeals);
router.get('/:mealId', mealController.getMeal);
router.post('/', mealController.createMeal);
router.put('/:mealId', mealController.updateMeal);

module.exports = router;