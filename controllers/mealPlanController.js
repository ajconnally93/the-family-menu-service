const mongoose = require('mongoose');
const MealPlan = require('../models/MealPlan');
const Meal = require('../models/Meal');

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

    const mealPlan = await MealPlan.findById(planId);

    if (!mealPlan) {
      return res.status(404).json({
        error: {
          code: 'MEAL_PLAN_NOT_FOUND',
          message: 'No meal plan exists for the supplied planId.'
        }
      });
    }

    if (includeMeals === 'true') {
      const populatedPlan = await MealPlan.findById(planId).populate({
        path: 'meals.mealId',
        select: 'title estimatedMealCost imageUrl'
      });

      const reshapedMeals = populatedPlan.meals.map((mealEntry) => ({
        mealId: mealEntry.mealId._id,
        servingsOverride: mealEntry.servingsOverride,
        meal: {
          title: mealEntry.mealId.title,
          estimatedMealCost: mealEntry.mealId.estimatedMealCost,
          imageUrl: mealEntry.mealId.imageUrl
        }
      }));

      return res.status(200).json({
        data: {
          _id: populatedPlan._id,
          userId: populatedPlan.userId,
          status: populatedPlan.status,
          estimatedTotalCost: populatedPlan.estimatedTotalCost,
          meals: reshapedMeals,
          updatedAt: populatedPlan.updatedAt
        }
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

const addMealToPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { mealId, servingsOverride = null } = req.body;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'planId must be a valid ObjectId.'
        }
      });
    }

    if (!mealId) {
      return res.status(400).json({
        error: {
          code: 'MEAL_ID_REQUIRED',
          message: 'mealId is required.'
        }
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_MEAL_ID',
          message: 'mealId must be a valid ObjectId.'
        }
      });
    }

    const mealPlan = await MealPlan.findById(planId);

    if (!mealPlan) {
      return res.status(404).json({
        error: {
          code: 'MEAL_PLAN_NOT_FOUND',
          message: 'No meal plan exists for the supplied planId.'
        }
      });
    }

    const meal = await Meal.findById(mealId);

    if (!meal) {
      return res.status(404).json({
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'No meal exists for the supplied mealId.'
        }
      });
    }

    const alreadyInPlan = mealPlan.meals.some(
      (mealRef) => mealRef.mealId.toString() === mealId
    );

    if (alreadyInPlan) {
      return res.status(409).json({
        error: {
          code: 'MEAL_ALREADY_IN_PLAN',
          message: 'This meal has already been added to the selected meal plan.'
        }
      });
    }

    mealPlan.meals.push({
      mealId,
      servingsOverride
    });

    mealPlan.estimatedTotalCost += meal.estimatedMealCost;

    await mealPlan.save();

    res.status(201).json({
      data: {
        planId: mealPlan._id,
        mealCount: mealPlan.meals.length,
        estimatedTotalCost: mealPlan.estimatedTotalCost
      },
      message: 'Meal added to meal plan successfully.'
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

const removeMealFromPlan = async (req, res) => {
  try {
    const { planId, mealId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'planId must be a valid ObjectId.'
        }
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_MEAL_ID',
          message: 'mealId must be a valid ObjectId.'
        }
      });
    }

    const mealPlan = await MealPlan.findById(planId);

    if (!mealPlan) {
      return res.status(404).json({
        error: {
          code: 'MEAL_PLAN_NOT_FOUND',
          message: 'No meal plan exists for the supplied planId.'
        }
      });
    }

    const mealIndex = mealPlan.meals.findIndex(
      (mealRef) => mealRef.mealId.toString() === mealId
    );

    if (mealIndex === -1) {
      return res.status(404).json({
        error: {
          code: 'MEAL_NOT_IN_PLAN',
          message: 'This meal is not part of the selected meal plan.'
        }
      });
    }

    const meal = await Meal.findById(mealId);

    if (meal) {
      mealPlan.estimatedTotalCost -= meal.estimatedMealCost;

      if (mealPlan.estimatedTotalCost < 0) {
        mealPlan.estimatedTotalCost = 0;
      }
    }

    mealPlan.meals.splice(mealIndex, 1);

    await mealPlan.save();

    res.status(200).json({
      data: {
        planId: mealPlan._id,
        mealCount: mealPlan.meals.length,
        estimatedTotalCost: mealPlan.estimatedTotalCost
      },
      message: 'Meal removed from meal plan successfully.'
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
  updateMealPlan,
  addMealToPlan,
  removeMealFromPlan
};