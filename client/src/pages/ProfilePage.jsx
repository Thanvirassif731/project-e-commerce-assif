import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const ProfilePage = () => {
  const { userInfo, fetchProfileSummary } = useShop();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      if (!userInfo) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchProfileSummary();
        setSummary(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Could not load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [fetchProfileSummary, userInfo]);

  if (!userInfo) {
    return (
      <p className="status-text">
        Please <Link to="/login?next=/profile">sign in</Link> to view your profile.
      </p>
    );
  }

  if (loading) {
    return <p className="status-text">Loading profile...</p>;
  }

  if (error) {
    return <p className="status-text error">{error}</p>;
  }

  return (
    <section className="profile-layout">
      <article className="profile-card">
        <h1>My Profile</h1>
        <p>
          Name: <strong>{summary.user.name}</strong>
        </p>
        <p>
          Email: <strong>{summary.user.email}</strong>
        </p>
        <p>
          Member since: <strong>{new Date(summary.user.createdAt).toLocaleDateString()}</strong>
        </p>
      </article>

      <article className="profile-card">
        <h2>Purchase Overview</h2>
        <p>
          Total orders: <strong>{summary.metrics.totalOrders}</strong>
        </p>
        <p>
          Total spent: <strong>${summary.metrics.totalSpent.toFixed(2)}</strong>
        </p>
      </article>

      <article className="profile-card profile-full">
        <h2>Purchase History</h2>
        {summary.orders.length === 0 ? (
          <p className="status-text">No purchases yet.</p>
        ) : (
          <div className="orders-list">
            {summary.orders.map((order) => (
              <article key={order._id} className="order-card profile-order-card">
                <div>
                  <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                  <p>Status: {order.status}</p>
                  <p>
                    Discount: {order.coupon?.code ? `${order.coupon.code} (-$${order.discountAmount.toFixed(2)})` : 'None'}
                  </p>
                </div>
                <div className="profile-order-pricing">
                  <p>Subtotal: ${order.subtotalPrice.toFixed(2)}</p>
                  <p>Shipping: ${order.shippingPrice.toFixed(2)}</p>
                  <strong>Total: ${order.totalPrice.toFixed(2)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
};

export default ProfilePage;
