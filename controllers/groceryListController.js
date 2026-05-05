const groceryListService = require('../services/groceryListService');
const GroceryList = require('../models/GroceryList');
const { generateGroceryList } = require('../services/groceryListService');

const generateAndSaveGroceryList = async (req, res) => {
  try {
    const { planId } = req.params;

    const generatedList = await generateGroceryList(planId);

    const groceryList = await GroceryList.create({
      mealPlanId: generatedList.mealPlanId,
      userId: generatedList.userId,
      items: generatedList.items,
      estimatedTotalCost: generatedList.estimatedTotalCost
    });

    res.status(201).json({
      data: groceryList,
      message: 'Grocery list generated successfully.'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || 'SERVER_ERROR',
        message: error.message
      }
    });
  }
};

const getLatestGroceryList = async (req, res) => {
  try {
    const { planId } = req.params;

    const groceryList = await GroceryList.findOne({ mealPlanId: planId }).sort({
      generatedAt: -1,
      createdAt: -1
    });

    if (!groceryList) {
      return res.status(404).json({
        error: {
          code: 'GROCERY_LIST_NOT_FOUND',
          message: 'No generated grocery list exists yet for this meal plan.'
        }
      });
    }

    res.status(200).json({
      data: groceryList
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

async function updateGroceryItemCheckedStatus(req, res, next) {
  try {
    const { planId, ingredientId } = req.params;
    const { checked } = req.body;

    const groceryList = await groceryListService.updateGroceryItemCheckedStatus(
      planId,
      ingredientId,
      checked
    );

    res.json({
      success: true,
      data: groceryList
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateAndSaveGroceryList,
  getLatestGroceryList,
  updateGroceryItemCheckedStatus
};