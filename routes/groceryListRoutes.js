const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  generateAndSaveGroceryList,
  getLatestGroceryList,
  updateGroceryItemCheckedStatus
} = require('../controllers/groceryListController');

router.post('/generate', generateAndSaveGroceryList);
router.get('/latest', getLatestGroceryList);

router.patch('/items/:ingredientId/checked', updateGroceryItemCheckedStatus);

module.exports = router;