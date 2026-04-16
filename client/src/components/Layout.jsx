import { Link, NavLink, Outlet } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const Layout = () => {
  const { cartSummary, userInfo, logout } = useShop();

  return (
    <div className="page-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          NovaCart
        </Link>

        <nav className="main-nav">
          <NavLink to="/" end>
            Shop
          </NavLink>
          {userInfo && <NavLink to="/profile">Profile</NavLink>}
          <NavLink to="/orders">Orders</NavLink>
          {userInfo?.isAdmin && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/cart">Cart ({cartSummary.itemsCount})</NavLink>
        </nav>

        <div className="auth-panel">
          {userInfo ? (
            <>
              <span className="welcome">Hi, {userInfo.name.split(' ')[0]}</span>
              <button type="button" onClick={logout} className="link-button">
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="cta-link">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
