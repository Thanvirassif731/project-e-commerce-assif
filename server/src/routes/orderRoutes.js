const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createOrder);
router.route('/my-orders').get(protect, getMyOrders);

module.exports = router;
