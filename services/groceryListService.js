const GroceryList = require('../models/GroceryList');
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

  // get existing grocery list to preserve checked state
  const existingGroceryList = await GroceryList.findOne({
    mealPlanId: planId
  }).sort({
    generatedAt: -1,
    createdAt: -1
  });

  // 2. Aggregate ingredients
  const ingredientMap = new Map();

  for (const mealEntry of mealPlan.meals) {
    const meal = mealEntry.mealId;

    if (!meal) continue;

    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.ingredientId}-${ingredient.unit}`;

      if (!ingredientMap.has(key)) {
        // find existing item (if it exists)
        const existingItem = existingGroceryList?.items.find(
          (item) =>
            String(item.ingredientId) === String(ingredient.ingredientId) &&
            String(item.unit) === String(ingredient.unit)
        );

        ingredientMap.set(key, {
          ingredientId: ingredient.ingredientId,
          name: ingredient.name,
          totalQuantity: 0,
          unit: ingredient.unit,
          estimatedLineCost: 0,
          sourceMealIds: [],
          checked: existingItem?.checked || false, // PRESERVE CHECKED STATE
          checkedQuantity: existingItem?.checkedQuantity ?? null
        });
      }

      const existing = ingredientMap.get(key);

      existing.totalQuantity += ingredient.quantity;
      existing.estimatedLineCost +=
        ingredient.quantity * ingredient.estimatedUnitCost;

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

async function updateGroceryItemCheckedStatus(mealPlanId, ingredientId, checked) {
  const groceryList = await GroceryList.findOne({
    mealPlanId
  });

  if (!groceryList) {
    const error = new Error('Grocery list not found');
    error.statusCode = 404;
    error.code = 'GROCERY_LIST_NOT_FOUND';
    throw error;
  }

  const item = groceryList.items.find(
    (groceryItem) => String(groceryItem.ingredientId) === String(ingredientId)
  );

  if (!item) {
    const error = new Error('Grocery item not found');
    error.statusCode = 404;
    error.code = 'GROCERY_ITEM_NOT_FOUND';
    throw error;
  }

  item.checked = checked;
  item.checkedQuantity = checked ? item.totalQuantity : null;

  await groceryList.save();

  return groceryList;
}

module.exports = {
  generateGroceryList,
  updateGroceryItemCheckedStatus
};