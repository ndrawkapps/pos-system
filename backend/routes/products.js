const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, productController.getAllProducts);
router.get('/:id', authenticate, productController.getProductById);
router.post('/', 
  authenticate, 
  authorize('all'), 
  upload.single('image'), 
  productController.createProduct
);
router.put('/:id', 
  authenticate, 
  authorize('all'), 
  upload.single('image'), 
  productController.updateProduct
);
router.delete('/:id', authenticate, authorize('all'), productController.deleteProduct);

module.exports = router;