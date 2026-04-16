import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const OrdersPage = () => {
  const location = useLocation();
  const { fetchMyOrders, userInfo } = useShop();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const placedOrderId = new URLSearchParams(location.search).get('placed');

  useEffect(() => {
    const loadOrders = async () => {
      if (!userInfo) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [fetchMyOrders, userInfo]);

  if (!userInfo) {
    return (
      <p className="status-text">
        Please <Link to="/login?next=/orders">sign in</Link> to view your orders.
      </p>
    );
  }

  if (loading) {
    return <p className="status-text">Loading your orders...</p>;
  }

  if (error) {
    return <p className="status-text error">{error}</p>;
  }

  return (
    <section>
      <h1>My Orders</h1>

      {placedOrderId && <p className="status-text success">Order {placedOrderId} was placed successfully.</p>}

      {orders.length === 0 ? (
        <p className="status-text">You have no orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order._id} className="order-card">
              <div>
                <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                <p>Status: {order.status}</p>
                <p>Payment: {order.paymentMethod}</p>
              </div>
              <strong>${order.totalPrice.toFixed(2)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default OrdersPage;
