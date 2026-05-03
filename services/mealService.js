const Meal = require('../models/Meal');

function calculateEstimatedMealCost(ingredients = []) {
  return Number(
    ingredients
      .reduce((total, ingredient) => {
        const quantity = Number(ingredient.quantity) || 0;
        const unitCost = Number(ingredient.estimatedUnitCost) || 0;

        return total + quantity * unitCost;
      }, 0)
      .toFixed(2)
  );
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMealQuery({ search, tag }) {
  const query = {};
    // Built functionality for searching if I decided to implement it later
    // This will also support the ability to filter by tag and then searching based on the selected tags
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  if (tag) {
    const escapedTag = escapeRegex(tag.trim());
    query.tags = { $regex: `^${escapedTag}$`, $options: 'i' };
  }

  return query;
}

function buildMealSort(sort) {
  switch (sort) {
    case 'title':
      return { title: 1 };
    case 'costAsc':
      return { estimatedMealCost: 1 };
    case 'costDesc':
      return { estimatedMealCost: -1 };
    case 'newest':
      return { createdAt: -1 };
    case undefined:
    case '':
      return { title: 1 };
    default:
      return null;
  }
}

async function getAllMeals({ search, tag, sort }) {
  const query = buildMealQuery({ search, tag });
    // Built support for a Sorting option if I decide to implement it
  const sortOption = buildMealSort(sort);

  if (!sortOption) {
    const error = new Error('sort must be one of: title, costAsc, costDesc, newest.');
    error.statusCode = 400;
    error.code = 'INVALID_QUERY_PARAMETER';
    throw error;
  }

  // built sorting logic to add later as a stretch goal
  const meals = await Meal.find(query).sort(sortOption);

  return {
    data: meals,
    meta: {
      count: meals.length,
      filters: {
        search: search || null,
        tag: tag || null,
        sort: sort || 'title'
      }
    }
  };
}

async function getMealById(mealId) {
  return Meal.findById(mealId);
}

async function createMeal(mealData) {
  const estimatedMealCost = calculateEstimatedMealCost(mealData.ingredients);

  const meal = new Meal({
    ...mealData,
    estimatedMealCost
  });

  const savedMeal = await meal.save();

  return {
    data: {
      _id: savedMeal._id,
      title: savedMeal.title,
      estimatedMealCost: savedMeal.estimatedMealCost,
      createdAt: savedMeal.createdAt,
      updatedAt: savedMeal.updatedAt
    },
    message: 'Meal created successfully.'
  };
}

async function createManyMeals(mealsData) {
  if (!Array.isArray(mealsData)) {
    const error = new Error('Request body must be an array of meals.');
    error.statusCode = 400;
    error.code = 'INVALID_REQUEST_BODY';
    throw error;
  }

  if (!mealsData.length) {
    const error = new Error('At least one meal is required.');
    error.statusCode = 400;
    error.code = 'EMPTY_MEAL_LIST';
    throw error;
  }

  const mealsWithCosts = mealsData.map((mealData) => ({
    ...mealData,
    estimatedMealCost: calculateEstimatedMealCost(mealData.ingredients)
  }));

  const savedMeals = await Meal.insertMany(mealsWithCosts, {
    ordered: true,
    runValidators: true
  });

  return {
    data: savedMeals,
    meta: {
      count: savedMeals.length
    },
    message: 'Meals created successfully.'
  };
}

async function updateMeal(mealId, updateData) {
  const existingMeal = await Meal.findById(mealId);

  if (!existingMeal) {
    const error = new Error('Meal not found');
    error.statusCode = 404;
    error.code = 'MEAL_NOT_FOUND';
    throw error;
  }

  const ingredientsForCost =
    updateData.ingredients !== undefined
      ? updateData.ingredients
      : existingMeal.ingredients;

  const estimatedMealCost = calculateEstimatedMealCost(ingredientsForCost);

  const updatedMeal = await Meal.findByIdAndUpdate(
    mealId,
    {
      ...updateData,
      estimatedMealCost
    },
    {
      new: true,
      runValidators: true
    }
  );

  return {
    data: {
      _id: updatedMeal._id,
      estimatedMealCost: updatedMeal.estimatedMealCost,
      updatedAt: updatedMeal.updatedAt
    },
    message: 'Meal updated successfully.'
  };
}

module.exports = {
  getAllMeals,
  getMealById,
  createMeal,
  createManyMeals,
  updateMeal
};