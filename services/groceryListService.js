const MealPlan = require('../models/MealPlan');

const generateGroceryList = async (planId) => {
  // 1. Load meal plan + populate meals
  const mealPlan = await MealPlan.findById(planId).populate({
    path: 'meals.mealId',
    select: 'ingredients'
  });

  if (!mealPlan) {
    const error = new Error('Meal plan not found.');
    error.statusCode = 404;
    error.code = 'MEAL_PLAN_NOT_FOUND';
    throw error;
  }

  if (!mealPlan.meals.length) {
    const error = new Error('Cannot generate a grocery list for a meal plan with zero meals.');
    error.statusCode = 400;
    error.code = 'EMPTY_MEAL_PLAN';
    throw error;
  }

  // 2. Aggregate ingredients
  const ingredientMap = new Map();

  for (const mealEntry of mealPlan.meals) {
    const meal = mealEntry.mealId;

    if (!meal) continue;

    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.ingredientId}-${ingredient.unit}`;

      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          ingredientId: ingredient.ingredientId,
          name: ingredient.name,
          totalQuantity: 0,
          unit: ingredient.unit,
          estimatedLineCost: 0,
          sourceMealIds: []
        });
      }

      const existing = ingredientMap.get(key);

      existing.totalQuantity += ingredient.quantity;
      existing.estimatedLineCost += (ingredient.quantity * ingredient.estimatedUnitCost);

      if (!existing.sourceMealIds.includes(meal._id)) {
        existing.sourceMealIds.push(meal._id);
      }
    }
  }

  // 3. Convert to array
  const items = Array.from(ingredientMap.values());

  // 4. Calculate total cost
  const estimatedTotalCost = items.reduce((sum, item) => {
    return sum + item.estimatedLineCost;
  }, 0);

  return {
    mealPlanId: mealPlan._id,
    userId: mealPlan.userId,
    items,
    estimatedTotalCost
  };
};

module.exports = {
  generateGroceryList
};