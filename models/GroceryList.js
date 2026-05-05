const mongoose = require('mongoose');

const groceryListItemSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    estimatedLineCost: {
      type: Number,
      required: true,
      min: 0
    },
    sourceMealIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Meal'
        }
      ],
      default: []
    },
    checked: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const groceryListSchema = new mongoose.Schema(
  {
    mealPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [groceryListItemSchema],
      default: []
    },
    estimatedTotalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('GroceryList', groceryListSchema);