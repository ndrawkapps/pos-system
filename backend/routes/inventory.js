const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');

// All inventory routes require admin access
router.use(protect, adminOnly);

// ==================== INGREDIENTS ====================
router.get('/ingredients', inventoryController.getIngredients);
router.get('/ingredients/:id', inventoryController.getIngredientById);
router.post('/ingredients', inventoryController.createIngredient);
router.put('/ingredients/:id', inventoryController.updateIngredient);
router.delete('/ingredients/:id', inventoryController.deleteIngredient);

// ==================== STOCK MOVEMENTS ====================
router.post('/stock/adjust', inventoryController.adjustStock);
router.get('/stock/movements', inventoryController.getStockMovements);

// ==================== PRODUCT RECIPES ====================
router.get('/recipes/:product_id', inventoryController.getProductRecipe);
router.post('/recipes/:product_id', inventoryController.setProductRecipe);

// ==================== STOCK CHECK (can be used by kasir) ====================
router.post('/check-stock', inventoryController.checkProductsStock);

module.exports = router;
