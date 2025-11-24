const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, categoryController.getAllCategories);
router.post('/', authenticate, authorize('all'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('all'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('all'), categoryController.deleteCategory);

module.exports = router;