import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useShop();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextPath = new URLSearchParams(location.search).get('next') || '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
          throw new Error(
            'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
          );
        }

        await register({ name, email, password });
      } else {
        await login({ email, password });
      }

      navigate(nextPath);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-shell">
      <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
      <p className="form-subtitle">Access your cart and place orders securely.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'register' && (
          <label>
            Full Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        {mode === 'register' && (
          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
        )}

        {mode === 'register' && (
          <p className="helper-text">
            Use at least 8 characters with uppercase, lowercase, and a number.
          </p>
        )}

        {error && <p className="status-text error">{error}</p>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="form-switch">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button type="button" className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Register' : 'Log in'}
        </button>
      </p>

      <p className="form-switch">
        <Link to="/">Back to shop</Link>
      </p>
    </section>
  );
};

export default LoginPage;
