const mongoose = require('mongoose');
const MealPlan = require('../models/MealPlan');
const Meal = require('../models/Meal');
const GroceryList = require('../models/GroceryList');
const { generateGroceryList } = require('../services/groceryListService');

const refreshGroceryListForMealPlan = async (planId) => {
  const generatedList = await generateGroceryList(planId);

  const groceryList = await GroceryList.findOneAndUpdate(
    { mealPlanId: generatedList.mealPlanId },
    {
      mealPlanId: generatedList.mealPlanId,
      userId: generatedList.userId,
      items: generatedList.items,
      estimatedTotalCost: generatedList.estimatedTotalCost,
      generatedAt: new Date()
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  return groceryList;
};

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
        select: 'title description ingredients instructions estimatedMealCost imageUrl'
      });

      const reshapedMeals = populatedPlan.meals.map((mealEntry) => ({
        mealId: mealEntry.mealId._id,
        servingsOverride: mealEntry.servingsOverride,
        meal: {
          title: mealEntry.mealId.title,
          description: mealEntry.mealId.description,
          ingredients: mealEntry.mealId.ingredients,
          instructions: mealEntry.mealId.instructions,
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

    await mealPlan.save();

    const groceryList = await refreshGroceryListForMealPlan(mealPlan._id);

    mealPlan.estimatedTotalCost = groceryList.estimatedTotalCost;
    await mealPlan.save();

    res.status(201).json({
      data: {
        planId: mealPlan._id,
        mealCount: mealPlan.meals.length,
        estimatedTotalCost: mealPlan.estimatedTotalCost
      },
      message: 'Meal added to meal plan and grocery list updated successfully.'
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

    mealPlan.meals.splice(mealIndex, 1);

    await mealPlan.save();

    if (mealPlan.meals.length > 0) {
      const groceryList = await refreshGroceryListForMealPlan(mealPlan._id);

      mealPlan.estimatedTotalCost = groceryList.estimatedTotalCost;
      await mealPlan.save();
    } else {
      mealPlan.estimatedTotalCost = 0;
      await mealPlan.save();

      await GroceryList.deleteMany({ mealPlanId: mealPlan._id });
    }

    res.status(200).json({
      data: {
        planId: mealPlan._id,
        mealCount: mealPlan.meals.length,
        estimatedTotalCost: mealPlan.estimatedTotalCost
      },
      message: 'Meal removed from meal plan and grocery list updated successfully.'
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

// const generateGroceryList = async (req, res) => {
//   try {
//     const { planId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(planId)) {
//       return res.status(400).json({
//         error: {
//           code: 'INVALID_PLAN_ID',
//           message: 'planId must be a valid ObjectId.'
//         }
//       });
//     }

//     const mealPlan = await MealPlan.findById(planId).populate({
//       path: 'meals.mealId',
//       select: 'title ingredients'
//     });

//     if (!mealPlan) {
//       return res.status(404).json({
//         error: {
//           code: 'MEAL_PLAN_NOT_FOUND',
//           message: 'No meal plan exists for the supplied planId.'
//         }
//       });
//     }

//     if (!mealPlan.meals.length) {
//       return res.status(422).json({
//         error: {
//           code: 'EMPTY_MEAL_PLAN',
//           message: 'Cannot generate a grocery list for an empty meal plan.'
//         }
//       });
//     }

//     const groceryItemMap = new Map();

//     mealPlan.meals.forEach((mealEntry) => {
//       const meal = mealEntry.mealId;

//       if (!meal || !meal.ingredients) {
//         return;
//       }

//       meal.ingredients.forEach((ingredient) => {
//         const ingredientKey = `${ingredient.ingredientId}-${ingredient.unit}`;

//         if (!groceryItemMap.has(ingredientKey)) {
//           groceryItemMap.set(ingredientKey, {
//             ingredientId: ingredient.ingredientId,
//             name: ingredient.name,
//             totalQuantity: 0,
//             unit: ingredient.unit,
//             estimatedLineCost: 0,
//             sourceMealIds: []
//           });
//         }

//         const groceryItem = groceryItemMap.get(ingredientKey);

//         groceryItem.totalQuantity += ingredient.quantity;
//         groceryItem.estimatedLineCost +=
//           ingredient.quantity * ingredient.estimatedUnitCost;

//         groceryItem.sourceMealIds.push(meal._id);
//       });
//     });

//     const items = Array.from(groceryItemMap.values()).map((item) => ({
//       ...item,
//       totalQuantity: Number(item.totalQuantity.toFixed(2)),
//       estimatedLineCost: Number(item.estimatedLineCost.toFixed(2))
//     }));

//     const estimatedTotalCost = Number(
//       items
//         .reduce((total, item) => total + item.estimatedLineCost, 0)
//         .toFixed(2)
//     );

//     const groceryList = await GroceryList.create({
//       mealPlanId: mealPlan._id,
//       userId: mealPlan.userId,
//       items,
//       estimatedTotalCost
//     });

//     res.status(201).json({
//       data: groceryList,
//       message: 'Grocery list generated successfully.'
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: {
//         code: 'SERVER_ERROR',
//         message: error.message
//       }
//     });
//   }
// };

module.exports = {
  getMealPlans,
  createMealPlan,
  getMealPlanById,
  updateMealPlan,
  addMealToPlan,
  removeMealFromPlan,
  // generateGroceryList
};