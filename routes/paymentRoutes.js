const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/process', paymentController.processPayment);
router.post('/verify-upi', paymentController.verifyUPI);

module.exports = router;
