require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const products = require('./data/products');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const ensureAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || 'Admin User';

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await User.findOne({ email: adminEmail });

  if (!existing) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      isAdmin: true,
    });
    console.log(`Created admin user: ${adminEmail}`);
    return;
  }

  if (!existing.isAdmin) {
    existing.isAdmin = true;
    await existing.save();
    console.log(`Updated user to admin: ${adminEmail}`);
  }
};

const bootstrap = async () => {
  await connectDB();
  await ensureAdminUser();

  // Seed starter data if the product collection is empty.
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(products);
    console.log('Seeded default product catalog.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

bootstrap();
