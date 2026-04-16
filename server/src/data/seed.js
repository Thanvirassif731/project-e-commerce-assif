require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const products = require('./products');

const seedData = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    await Product.insertMany(products);

    console.log('Products seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
