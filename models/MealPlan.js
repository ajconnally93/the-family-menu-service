const mongoose = require('mongoose');

const mealPlanMealSchema = new mongoose.Schema(
  {
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: true
    },
    servingsOverride: {
      type: Number,
      default: null,
      min: 1
    }
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'finalized', 'archived'],
      default: 'draft'
    },
    meals: {
      type: [mealPlanMealSchema],
      default: []
    },
    estimatedTotalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('MealPlan', mealPlanSchema);