const Product = require('../models/Product');

const ALLOWED_SORT_FIELDS = ['createdAt', 'title', 'price', 'countInStock', 'rating', 'category'];

const normalizeProductInput = (payload) => {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  const image = payload.image?.trim();
  const category = payload.category?.trim();
  const price = Number(payload.price);
  const countInStock = Number(payload.countInStock);
  const rating = payload.rating === undefined ? 0 : Number(payload.rating);

  if (!title || !description || !image || !category) {
    return { error: 'Title, description, image, and category are required.' };
  }

  if (Number.isNaN(price) || price < 0) {
    return { error: 'Price must be a positive number.' };
  }

  if (Number.isNaN(countInStock) || countInStock < 0) {
    return { error: 'Stock must be 0 or greater.' };
  }

  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    return { error: 'Rating must be between 0 and 5.' };
  }

  return {
    value: {
      title,
      description,
      image,
      category,
      price,
      countInStock,
      rating,
    },
  };
};

const getProducts = async (req, res, next) => {
  try {
    const {
      keyword = '',
      category = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      paginate = 'false',
    } = req.query;

    const query = {
      title: { $regex: keyword, $options: 'i' },
    };

    if (category) {
      query.category = category;
    }

    const safeSortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

    if (paginate === 'true') {
      const currentPage = Math.max(Number(page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
      const skip = (currentPage - 1) * pageSize;

      const [items, totalItems] = await Promise.all([
        Product.find(query).sort({ [safeSortField]: safeSortOrder }).skip(skip).limit(pageSize),
        Product.countDocuments(query),
      ]);

      return res.status(200).json({
        items,
        totalItems,
        totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
        currentPage,
        pageSize,
        sortBy: safeSortField,
        sortOrder: safeSortOrder === 1 ? 'asc' : 'desc',
      });
    }

    const products = await Product.find(query).sort({ [safeSortField]: safeSortOrder });
    return res.status(200).json(products);
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { value, error } = normalizeProductInput(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const created = await Product.create(value);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { value, error } = normalizeProductInput(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
