const MealPlan = require('../models/MealPlan');

const getMealPlans = async (req, res) => {
  try {
    const { userId, status } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'userId query parameter is required.'
        }
      });
    }

    const query = { userId };

    if (status) {
      query.status = status;
    }

    const mealPlans = await MealPlan.find(query);

    res.status(200).json({
      data: mealPlans,
      meta: {
        count: mealPlans.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message
      }
    });
  }
};

const createMealPlan = async (req, res) => {
  try {
    const { userId, status = 'draft', meals = [] } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'userId is required.'
        }
      });
    }

    const validStatuses = ['draft', 'finalized', 'archived'];

    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        error: {
          code: 'INVALID_PLAN_STATUS',
          message: 'status must be one of: draft, finalized, archived.'
        }
      });
    }

    if (status === 'draft') {
      const existingDraftPlan = await MealPlan.findOne({ userId, status: 'draft' });

      if (existingDraftPlan) {
        return res.status(409).json({
          error: {
            code: 'DRAFT_PLAN_ALREADY_EXISTS',
            message: 'This user already has an active draft meal plan.'
          }
        });
      }
    }

    const mealPlan = await MealPlan.create({
      userId,
      status,
      meals,
      estimatedTotalCost: 0
    });

    res.status(201).json({
      data: mealPlan,
      message: 'Meal plan created successfully.'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message
      }
    });
  }
};

const getMealPlanById = async (req, res) => {
  try {
    const { planId } = req.params;
    const { includeMeals } = req.query;

    let mealPlan = await MealPlan.findById(planId);

    if (!mealPlan) {
      return res.status(404).json({
        error: {
          code: 'MEAL_PLAN_NOT_FOUND',
          message: 'No meal plan exists for the supplied planId.'
        }
      });
    }

    // If includeMeals=true, populate meal details
    if (includeMeals === 'true') {
      mealPlan = await MealPlan.findById(planId).populate({
        path: 'meals.mealId',
        select: 'title estimatedMealCost imageUrl'
      });
    }

    res.status(200).json({
      data: mealPlan
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message
      }
    });
  }
};

const updateMealPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, meals } = req.body;

    const mealPlan = await MealPlan.findById(planId);

    if (!mealPlan) {
      return res.status(404).json({
        error: {
          code: 'MEAL_PLAN_NOT_FOUND',
          message: 'No meal plan exists for the supplied planId.'
        }
      });
    }

    const validStatuses = ['draft', 'finalized', 'archived'];

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(422).json({
          error: {
            code: 'INVALID_PLAN_STATUS',
            message: 'status must be one of: draft, finalized, archived.'
          }
        });
      }

      mealPlan.status = status;
    }

    if (meals !== undefined) {
      mealPlan.meals = meals;
    }

    await mealPlan.save();

    res.status(200).json({
      data: {
        _id: mealPlan._id,
        status: mealPlan.status,
        estimatedTotalCost: mealPlan.estimatedTotalCost,
        updatedAt: mealPlan.updatedAt
      },
      message: 'Meal plan updated successfully.'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  getMealPlans,
  createMealPlan,
  getMealPlanById,
  updateMealPlan
};