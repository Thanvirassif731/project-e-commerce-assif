const express = require('express');
const {
  listCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/validate', protect, validateCoupon);
router.route('/').get(protect, adminOnly, listCoupons).post(protect, adminOnly, createCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
