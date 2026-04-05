const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    estimatedUnitCost: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    },
    estimatedMealCost: {
      type: Number,
      required: true,
      min: 0
    },
    ingredients: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: Array.isArray,
        message: 'ingredients must be an array'
      }
    },
    instructions: {
      type: [String],
      required: true,
      validate: {
        validator: Array.isArray,
        message: 'instructions must be an array'
      }
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Meal', mealSchema);