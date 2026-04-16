const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, shippingPrice = 0, couponCode = '' } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: 'Order items are required.' });
    }

    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const normalizedItems = [];
    let subtotalPrice = 0;

    for (const item of orderItems) {
      const product = productMap.get(String(item.product));

      if (!product) {
        return res.status(404).json({ message: 'One or more products do not exist.' });
      }

      if (item.quantity > product.countInStock) {
        return res.status(400).json({ message: `${product.title} is out of stock.` });
      }

      normalizedItems.push({
        product: product._id,
        title: product.title,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
      });

      subtotalPrice += product.price * item.quantity;
      product.countInStock -= item.quantity;
    }

    const safeShippingPrice = Math.max(Number(shippingPrice) || 0, 0);
    const safeCouponCode = couponCode?.trim().toUpperCase();
    let discountAmount = 0;
    let couponMeta = { code: null, discountType: null, discountValue: 0 };

    if (safeCouponCode) {
      const coupon = await Coupon.findOne({ code: safeCouponCode });

      if (!coupon || !coupon.active) {
        return res.status(400).json({ message: 'Coupon is invalid or inactive.' });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Coupon has expired.' });
      }

      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: 'Coupon usage limit reached.' });
      }

      if (subtotalPrice < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Coupon requires minimum order amount of $${coupon.minOrderAmount.toFixed(2)}.`,
        });
      }

      const eligibleSubtotal = normalizedItems.reduce((sum, item) => {
        const eligible =
          coupon.appliesToAllProducts ||
          coupon.applicableProducts.some((productId) => String(productId) === String(item.product));

        return eligible ? sum + item.price * item.quantity : sum;
      }, 0);

      if (eligibleSubtotal <= 0) {
        return res.status(400).json({ message: 'Coupon does not apply to selected products.' });
      }

      discountAmount =
        coupon.discountType === 'percent'
          ? Number(((eligibleSubtotal * coupon.discountValue) / 100).toFixed(2))
          : Number(Math.min(coupon.discountValue, eligibleSubtotal).toFixed(2));

      couponMeta = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      };

      coupon.usedCount += 1;
      await coupon.save();
    }

    const totalPrice = Number(Math.max(subtotalPrice + safeShippingPrice - discountAmount, 0).toFixed(2));

    await Promise.all(products.map((product) => product.save()));

    const order = await Order.create({
      user: req.user._id,
      orderItems: normalizedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      subtotalPrice,
      shippingPrice: safeShippingPrice,
      discountAmount,
      coupon: couponMeta,
      totalPrice,
    });

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
};
