import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';
import ProductCard from '../components/ProductCard';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get('/products', {
          params: {
            keyword,
            category,
          },
        });
        setProducts(data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, category]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((product) => product.category))];
    return uniqueCategories;
  }, [products]);

  return (
    <section>
      <div className="hero-banner">
        <p className="eyebrow">MERN e-commerce demo</p>
        <h1>Modern products for real life</h1>
        <p>
          Browse the catalog, add items to cart, sign in, and place orders with a complete full-stack
          workflow.
        </p>
      </div>

      <div className="filters">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search products"
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="status-text">Loading products...</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default HomePage;
