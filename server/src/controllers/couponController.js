const Coupon = require('../models/Coupon');
const Product = require('../models/Product');

const normalizeCode = (value) => value?.trim().toUpperCase();

const validateCouponInput = (payload) => {
  const code = normalizeCode(payload.code);
  const description = payload.description?.trim() || '';
  const discountType = payload.discountType || 'percent';
  const discountValue = Number(payload.discountValue);
  const minOrderAmount = Number(payload.minOrderAmount || 0);
  const appliesToAllProducts = payload.appliesToAllProducts !== false;
  const applicableProducts = Array.isArray(payload.applicableProducts) ? payload.applicableProducts : [];
  const maxUses = Number(payload.maxUses || 0);
  const active = payload.active !== false;
  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

  if (!code) {
    return { error: 'Coupon code is required.' };
  }

  if (!['percent', 'fixed'].includes(discountType)) {
    return { error: 'Discount type must be percent or fixed.' };
  }

  if (Number.isNaN(discountValue) || discountValue <= 0) {
    return { error: 'Discount value must be greater than 0.' };
  }

  if (discountType === 'percent' && discountValue > 100) {
    return { error: 'Percent discount cannot exceed 100.' };
  }

  if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) {
    return { error: 'Min order amount must be 0 or greater.' };
  }

  if (Number.isNaN(maxUses) || maxUses < 0) {
    return { error: 'Max uses must be 0 or greater.' };
  }

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { error: 'Invalid expiry date.' };
  }

  if (!appliesToAllProducts && applicableProducts.length === 0) {
    return { error: 'Select at least one product or set appliesToAllProducts to true.' };
  }

  return {
    value: {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      appliesToAllProducts,
      applicableProducts,
      maxUses,
      active,
      expiresAt,
    },
  };
};

const listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).populate('applicableProducts', 'title');
    return res.status(200).json(coupons);
  } catch (error) {
    return next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const { value, error } = validateCouponInput(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const existing = await Coupon.findOne({ code: value.code });
    if (existing) {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }

    const coupon = await Coupon.create(value);
    return res.status(201).json(coupon);
  } catch (error) {
    return next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const removed = await Coupon.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    return res.status(200).json({ message: 'Coupon deleted.' });
  } catch (error) {
    return next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderItems = [] } = req.body;
    const safeCode = normalizeCode(code);

    if (!safeCode) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    const coupon = await Coupon.findOne({ code: safeCode });
    if (!coupon || !coupon.active) {
      return res.status(404).json({ message: 'Coupon is invalid or inactive.' });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired.' });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon usage limit reached.' });
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: 'Order items are required to validate coupon.' });
    }

    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    let subtotal = 0;
    let eligibleSubtotal = 0;

    for (const item of orderItems) {
      const product = productMap.get(String(item.product));
      if (!product) {
        continue;
      }

      const lineTotal = product.price * Number(item.quantity || 0);
      subtotal += lineTotal;

      const eligible =
        coupon.appliesToAllProducts ||
        coupon.applicableProducts.some((productId) => String(productId) === String(product._id));

      if (eligible) {
        eligibleSubtotal += lineTotal;
      }
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Coupon requires minimum order amount of $${coupon.minOrderAmount.toFixed(2)}.`,
      });
    }

    if (eligibleSubtotal <= 0) {
      return res.status(400).json({ message: 'Coupon does not apply to selected products.' });
    }

    const discountAmount =
      coupon.discountType === 'percent'
        ? Number(((eligibleSubtotal * coupon.discountValue) / 100).toFixed(2))
        : Number(Math.min(coupon.discountValue, eligibleSubtotal).toFixed(2));

    return res.status(200).json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      subtotal,
      eligibleSubtotal,
      discountAmount,
      appliesToAllProducts: coupon.appliesToAllProducts,
      applicableProductIds: coupon.applicableProducts,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon,
};
