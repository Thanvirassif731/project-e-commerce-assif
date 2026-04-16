import { Link, useNavigate } from 'react-router-dom';
import QuantityPicker from '../components/QuantityPicker';
import { useShop } from '../context/ShopContext';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartSummary, removeFromCart, updateQuantity, userInfo } = useShop();

  return (
    <section>
      <h1>Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="status-text">
          Your cart is empty. <Link to="/">Start shopping</Link>.
        </p>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.map(({ product, quantity }) => (
              <article key={product._id} className="cart-item">
                <img src={product.image} alt={product.title} />
                <div>
                  <h3>{product.title}</h3>
                  <p>${product.price.toFixed(2)}</p>
                  <QuantityPicker
                    value={quantity}
                    max={product.countInStock}
                    onChange={(value) => updateQuantity(product._id, value)}
                  />
                </div>
                <button type="button" onClick={() => removeFromCart(product._id)} className="link-button">
                  Remove
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Summary</h2>
            <p>
              Items: <strong>{cartSummary.itemsCount}</strong>
            </p>
            <p>
              Subtotal: <strong>${cartSummary.subtotal.toFixed(2)}</strong>
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate(userInfo ? '/checkout' : '/login?next=/checkout')}
            >
              Proceed to checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
