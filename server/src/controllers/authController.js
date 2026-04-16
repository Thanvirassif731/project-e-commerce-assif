const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  token: generateToken(user._id),
});

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const safeName = name?.trim();
    const safeEmail = email?.trim().toLowerCase();

    if (!safeName || !safeEmail || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (safeName.length < 2 || safeName.length > 60) {
      return res
        .status(400)
        .json({ message: 'Name must be between 2 and 60 characters.' });
    }

    if (!/^\S+@\S+\.\S+$/.test(safeEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!passwordPolicy.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      });
    }

    const existingUser = await User.findOne({ email: safeEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const user = await User.create({ name: safeName, email: safeEmail, password });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const safeEmail = email?.trim().toLowerCase();

    if (!safeEmail || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: safeEmail });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    return next(error);
  }
};

const getProfileSummary = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    return res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        createdAt: req.user.createdAt,
      },
      metrics: {
        totalOrders: orders.length,
        totalSpent: Number(totalSpent.toFixed(2)),
      },
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMyProfile,
  getProfileSummary,
};
