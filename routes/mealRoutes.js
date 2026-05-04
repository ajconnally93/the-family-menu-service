const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');


// base routes
router.get('/', mealController.getMeals);

// RE-ADD ONCE AUTH IS FIXED
// router.post('/', mealController.createMeal);



// static routes
router.post('/bulk', mealController.createManyMeals);



// dynamic routes
router.get('/:mealId', mealController.getMeal);

// RE-ADD ONCE AUTH IS FIXED
// router.put('/:mealId', mealController.updateMeal);
// router.delete('/:mealId', mealController.deleteMeal);


module.exports = router;