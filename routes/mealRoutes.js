const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');


// base routes
router.get('/', mealController.getMeals);
router.post('/', mealController.createMeal);

// static routes
router.post('/bulk', mealController.createManyMeals);

// dynamic routes
router.get('/:mealId', mealController.getMeal);
router.put('/:mealId', mealController.updateMeal);


module.exports = router;