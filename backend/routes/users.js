const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('all'), userController.getAllUsers);
router.post('/', authenticate, authorize('all'), userController.createUser);
router.put('/:id', authenticate, authorize('all'), userController.updateUser);
router.delete('/:id', authenticate, authorize('all'), userController.deleteUser);

module.exports = router;