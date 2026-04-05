const Meal = require('../models/Meal');

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
    query.tags = { $regex: `^${tag}$`, $options: 'i' };
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
  const meal = new Meal(mealData);
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

async function updateMeal(mealId, updateData) {
  const updatedMeal = await Meal.findByIdAndUpdate(
    mealId,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedMeal) {
    const error = new Error('Meal not found');
    error.statusCode = 404;
    error.code = 'MEAL_NOT_FOUND';
    throw error;
  }

  return {
    data: {
      _id: updatedMeal._id,
      updatedAt: updatedMeal.updatedAt
    },
    message: 'Meal updated successfully.'
  };
}

module.exports = {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal
};