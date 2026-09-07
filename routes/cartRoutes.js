const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, cartController.getCart);
router.post('/add', authenticate, cartController.addToCart);
router.put('/items/:productId', authenticate, cartController.updateCartItem);
router.delete('/items/:productId', authenticate, cartController.removeFromCart);
router.delete('/clear', authenticate, cartController.clearCart);
router.post('/sync', authenticate, cartController.syncCart);

module.exports = router;
