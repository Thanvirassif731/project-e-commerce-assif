import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <section className="form-shell">
      <h1>Page not found</h1>
      <p className="form-subtitle">The page you are looking for does not exist.</p>
      <Link to="/" className="primary-btn">
        Return to home
      </Link>
    </section>
  );
};

export default NotFoundPage;
