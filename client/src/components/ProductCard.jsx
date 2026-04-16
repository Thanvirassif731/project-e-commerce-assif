import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useShop();

  return (
    <article className="product-card">
      <Link to={`/product/${product._id}`} className="product-image-wrap">
        <img src={product.image} alt={product.title} className="product-image" />
      </Link>

      <div className="product-content">
        <p className="product-category">{product.category}</p>
        <h3>{product.title}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <span className="price">${product.price.toFixed(2)}</span>
          <span className="stock">{product.countInStock} left</span>
        </div>

        <button
          type="button"
          onClick={() => addToCart(product, 1)}
          className="primary-btn"
          disabled={product.countInStock === 0}
        >
          {product.countInStock === 0 ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
