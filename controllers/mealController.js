// NOTE: create/update logic is delegated to mealService

const mongoose = require('mongoose');
const mealService = require('../services/mealService');

async function getMeals(req, res) {
  try {
    const { search, tag, sort } = req.query;

    const result = await mealService.getAllMeals({ search, tag, sort });

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred.'
      }
    });
  }
}

async function getMeal(req, res) {
  try {
    const { mealId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(404).json({
        error: {
          code: 'MEAL_NOT_FOUND',
          message: `No meal exists for mealId ${mealId}.`
        }
      });
    }

    const meal = await mealService.getMealById(mealId);

    if (!meal) {
      return res.status(404).json({
        error: {
          code: 'MEAL_NOT_FOUND',
          message: `No meal exists for mealId ${mealId}.`
        }
      });
    }

    res.status(200).json({
      data: meal
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.'
      }
    });
  }
}

async function createMeal(req, res) {
  try {
    const result = await mealService.createMeal(req.body);

    res.status(201).json(result);
  } catch (error) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
}

async function createManyMeals(req, res) {
  try {
    const result = await mealService.createManyMeals(req.body);

    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 422).json({
      error: {
        code: error.code || 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
}

async function updateMeal(req, res) {
  try {
    const { mealId } = req.params;

    const result = await mealService.updateMeal(mealId, req.body);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    });
  }
}

module.exports = {
  getMeals,
  getMeal,
  createMeal,
  createManyMeals,
  updateMeal
};