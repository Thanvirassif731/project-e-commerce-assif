import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import QuantityPicker from '../components/QuantityPicker';
import { useShop } from '../context/ShopContext';

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart } = useShop();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <p className="status-text">Loading product...</p>;
  }

  if (error || !product) {
    return <p className="status-text error">{error || 'Product not found.'}</p>;
  }

  return (
    <section className="detail-layout">
      <img src={product.image} alt={product.title} className="detail-image" />

      <div className="detail-content">
        <Link to="/" className="subtle-link">
          Back to shop
        </Link>
        <p className="product-category">{product.category}</p>
        <h1>{product.title}</h1>
        <p className="detail-description">{product.description}</p>

        <div className="detail-meta">
          <strong>${product.price.toFixed(2)}</strong>
          <span>{product.countInStock} in stock</span>
          <span>Rating: {product.rating}/5</span>
        </div>

        <QuantityPicker
          value={quantity}
          max={product.countInStock}
          onChange={(value) => setQuantity(Math.max(1, Math.min(value, product.countInStock)))}
        />

        <button
          type="button"
          className="primary-btn"
          onClick={() => addToCart(product, quantity)}
          disabled={product.countInStock === 0}
        >
          Add {quantity} to cart
        </button>
      </div>
    </section>
  );
};

export default ProductPage;
