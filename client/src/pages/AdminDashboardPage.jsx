import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';
import { useShop } from '../context/ShopContext';

const emptyForm = {
  title: '',
  description: '',
  price: '',
  image: '',
  category: '',
  countInStock: '',
  rating: '0',
};

const emptyCouponForm = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minOrderAmount: '0',
  appliesToAllProducts: true,
  applicableProducts: [],
  maxUses: '0',
  active: true,
  expiresAt: '',
};

const AdminDashboardPage = () => {
  const { userInfo, createProduct, updateProduct, deleteProduct, fetchCoupons, createCoupon, deleteCoupon } = useShop();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponLoading, setCouponLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const loadProducts = useCallback(async (targetPage) => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/products', {
        params: {
          paginate: true,
          page: targetPage,
          limit,
          sortBy,
          sortOrder,
        },
      });

      setProducts(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setPage(data.currentPage);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [limit, sortBy, sortOrder]);

  const loadAllProducts = useCallback(async () => {
    const { data } = await apiClient.get('/products');
    setAllProducts(data);
  }, []);

  const loadCoupons = useCallback(async () => {
    try {
      setCouponLoading(true);
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load coupons.');
    } finally {
      setCouponLoading(false);
    }
  }, [fetchCoupons]);

  useEffect(() => {
    loadProducts(1);
    loadAllProducts();
    loadCoupons();
  }, [loadProducts, loadAllProducts, loadCoupons]);

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      image: product.image,
      category: product.category,
      countInStock: String(product.countInStock),
      rating: String(product.rating ?? 0),
    });
    setSuccess('');
    setError('');
  };

  const resetForm = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCouponChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCouponForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCouponProductsChange = (event) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setCouponForm((prev) => ({ ...prev, applicableProducts: selected }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        countInStock: Number(form.countInStock),
        rating: Number(form.rating),
      };

      if (isEditing) {
        await updateProduct(editingId, payload);
        setSuccess('Product updated.');
      } else {
        await createProduct(payload);
        setSuccess('Product created.');
      }

      resetForm();
      await loadProducts(page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('image', file);

      const { data } = await apiClient.post('/upload/product-image', formData, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm((prev) => ({ ...prev, image: data.imageUrl }));
      setSuccess('Image uploaded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (productId) => {
    const accepted = window.confirm('Delete this product?');
    if (!accepted) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await deleteProduct(productId);
      setSuccess('Product deleted.');
      if (editingId === productId) {
        resetForm();
      }
      const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
      await loadProducts(nextPage);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const submitCoupon = async (event) => {
    event.preventDefault();
    setCouponSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...couponForm,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minOrderAmount),
        maxUses: Number(couponForm.maxUses),
      };

      await createCoupon(payload);
      setCouponForm(emptyCouponForm);
      setSuccess('Coupon created.');
      await loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not create coupon.');
    } finally {
      setCouponSaving(false);
    }
  };

  const removeCoupon = async (couponId) => {
    const accepted = window.confirm('Delete this coupon?');
    if (!accepted) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await deleteCoupon(couponId);
      setSuccess('Coupon deleted.');
      await loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not delete coupon.');
    }
  };

  if (!userInfo) {
    return <p className="status-text error">Please sign in to access the admin dashboard.</p>;
  }

  if (!userInfo.isAdmin) {
    return <p className="status-text error">You are signed in but do not have admin access.</p>;
  }

  return (
    <section className="admin-layout">
      <div className="admin-form-panel">
        <h1>{isEditing ? 'Edit Product' : 'Create Product'}</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>

          <label>
            Description
            <input name="description" value={form.description} onChange={handleChange} required />
          </label>

          <label>
            Image URL
            <input name="image" value={form.image} onChange={handleChange} required />
          </label>

          <label>
            Upload Image
            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
            <span className="helper-text">
              {uploading ? 'Uploading image...' : 'You can paste a URL or upload an image file.'}
            </span>
          </label>

          <label>
            Category
            <input name="category" value={form.category} onChange={handleChange} required />
          </label>

          <label>
            Price
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Stock
            <input
              type="number"
              name="countInStock"
              min="0"
              step="1"
              value={form.countInStock}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Rating
            <input
              type="number"
              name="rating"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="status-text error">{error}</p>}
          {success && <p className="status-text success">{success}</p>}

          <div className="admin-actions">
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update product' : 'Create product'}
            </button>
            {isEditing && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-list-panel">
        <h2>All Products</h2>
        <div className="admin-table-tools">
          <p className="helper-text">{totalItems} total products</p>
          <div className="admin-sort-controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Newest</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
              <option value="countInStock">Stock</option>
              <option value="rating">Rating</option>
              <option value="category">Category</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {loading && <p className="status-text">Loading products...</p>}

        {!loading && (
          <>
            <div className="admin-products">
              {products.map((product) => (
                <article key={product._id} className="admin-product-card">
                  <img src={product.image} alt={product.title} />
                  <div>
                    <h3>{product.title}</h3>
                    <p>{product.category}</p>
                    <p>${product.price.toFixed(2)}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button type="button" className="secondary-btn" onClick={() => startEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className="danger-btn" onClick={() => handleDelete(product._id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                className="secondary-btn"
                disabled={page <= 1}
                onClick={() => loadProducts(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="secondary-btn"
                disabled={page >= totalPages}
                onClick={() => loadProducts(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <div className="admin-list-panel admin-coupon-panel">
        <h2>Discount Coupons</h2>

        <form className="auth-form" onSubmit={submitCoupon}>
          <label>
            Coupon Code
            <input name="code" value={couponForm.code} onChange={handleCouponChange} required />
          </label>

          <label>
            Description
            <input name="description" value={couponForm.description} onChange={handleCouponChange} />
          </label>

          <label>
            Discount Type
            <select name="discountType" value={couponForm.discountType} onChange={handleCouponChange}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>

          <label>
            Discount Value
            <input
              type="number"
              name="discountValue"
              min="0"
              step="0.01"
              value={couponForm.discountValue}
              onChange={handleCouponChange}
              required
            />
          </label>

          <label>
            Min Order Amount
            <input
              type="number"
              name="minOrderAmount"
              min="0"
              step="0.01"
              value={couponForm.minOrderAmount}
              onChange={handleCouponChange}
            />
          </label>

          <label>
            Max Uses (0 = unlimited)
            <input
              type="number"
              name="maxUses"
              min="0"
              step="1"
              value={couponForm.maxUses}
              onChange={handleCouponChange}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="appliesToAllProducts"
              checked={couponForm.appliesToAllProducts}
              onChange={handleCouponChange}
            />
            Applies to all products
          </label>

          {!couponForm.appliesToAllProducts && (
            <label>
              Applicable Products
              <select
                multiple
                value={couponForm.applicableProducts}
                onChange={handleCouponProductsChange}
                size={6}
              >
                {allProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="checkbox-row">
            <input type="checkbox" name="active" checked={couponForm.active} onChange={handleCouponChange} />
            Active
          </label>

          <label>
            Expires At
            <input type="datetime-local" name="expiresAt" value={couponForm.expiresAt} onChange={handleCouponChange} />
          </label>

          <button type="submit" className="primary-btn" disabled={couponSaving}>
            {couponSaving ? 'Creating...' : 'Create coupon'}
          </button>
        </form>

        {couponLoading && <p className="status-text">Loading coupons...</p>}

        {!couponLoading && (
          <div className="admin-coupon-list">
            {coupons.map((coupon) => (
              <article key={coupon._id} className="admin-coupon-card">
                <div>
                  <h3>{coupon.code}</h3>
                  <p>{coupon.description || 'No description'}</p>
                  <p>
                    {coupon.discountType === 'percent'
                      ? `${coupon.discountValue}% off`
                      : `$${coupon.discountValue.toFixed(2)} off`}
                  </p>
                  <p>
                    Used: {coupon.usedCount}
                    {coupon.maxUses > 0 ? `/${coupon.maxUses}` : ' (unlimited)'}
                  </p>
                </div>
                <button type="button" className="danger-btn" onClick={() => removeCoupon(coupon._id)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminDashboardPage;
