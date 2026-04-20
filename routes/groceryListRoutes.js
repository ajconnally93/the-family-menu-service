const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  generateAndSaveGroceryList,
  getLatestGroceryList
} = require('../controllers/groceryListController');

router.post('/generate', generateAndSaveGroceryList);
router.get('/latest', getLatestGroceryList);

module.exports = router;