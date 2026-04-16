import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartSummary, createOrder, validateCoupon } = useShop();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    paymentMethod: 'Cash on Delivery',
  });
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);

  const shippingCost = useMemo(() => (cartSummary.subtotal > 100 ? 0 : 10), [cartSummary.subtotal]);
  const discountAmount = couponPreview?.discountAmount || 0;
  const grandTotal = Math.max(cartSummary.subtotal + shippingCost - discountAmount, 0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setError('');

    try {
      const preview = await validateCoupon({
        code: couponCode,
        orderItems: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
      });

      setCouponPreview(preview);
    } catch (err) {
      setCouponPreview(null);
      setError(err.response?.data?.message || err.message || 'Coupon could not be applied.');
    } finally {
      setCouponLoading(false);
    }
  };

  const submitOrder = async (event) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setError('Cart is empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        orderItems: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        paymentMethod: form.paymentMethod,
        shippingPrice: shippingCost,
        couponCode: couponPreview?.code || '',
      };

      const createdOrder = await createOrder(orderPayload);
      navigate(`/orders?placed=${createdOrder._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="checkout-layout">
      <form onSubmit={submitOrder} className="checkout-form">
        <h1>Checkout</h1>

        <label>
          Full Name
          <input name="fullName" value={form.fullName} onChange={handleChange} required />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </label>

        <label>
          Address
          <input name="address" value={form.address} onChange={handleChange} required />
        </label>

        <label>
          City
          <input name="city" value={form.city} onChange={handleChange} required />
        </label>

        <label>
          Postal Code
          <input name="postalCode" value={form.postalCode} onChange={handleChange} required />
        </label>

        <label>
          Country
          <input name="country" value={form.country} onChange={handleChange} required />
        </label>

        <label>
          Payment Method
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </label>

        <label>
          Coupon Code
          <div className="coupon-row">
            <input
              name="couponCode"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon"
            />
            <button type="button" className="secondary-btn" onClick={applyCoupon} disabled={couponLoading}>
              {couponLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </label>

        {couponPreview?.code && (
          <p className="status-text success">
            Coupon {couponPreview.code} applied: -${couponPreview.discountAmount.toFixed(2)}
          </p>
        )}

        {error && <p className="status-text error">{error}</p>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Placing order...' : 'Place order'}
        </button>
      </form>

      <aside className="cart-summary">
        <h2>Order Summary</h2>
        <p>
          Subtotal: <strong>${cartSummary.subtotal.toFixed(2)}</strong>
        </p>
        <p>
          Shipping: <strong>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</strong>
        </p>
        <p>
          Discount: <strong>-${discountAmount.toFixed(2)}</strong>
        </p>
        <p>
          Total: <strong>${grandTotal.toFixed(2)}</strong>
        </p>
      </aside>
    </section>
  );
};

export default CheckoutPage;
