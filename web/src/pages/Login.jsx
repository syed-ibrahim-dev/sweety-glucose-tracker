
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, HeartPulse, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to log in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-icon"><HeartPulse size={23} /></span>
          <span>Sweety</span>
        </div>

        <div className="visual-content">
          <span className="eyebrow"><Leaf size={15} /> YOUR HEALTH, YOUR JOURNEY</span>
          <h1>Small steps.<br /><em>Healthier days.</em></h1>
          <p>
            A little awareness every day can make a meaningful difference.
            Keep your glucose readings organised, clear and close at hand.
          </p>
          <div className="visual-note">
            <span className="note-icon"><HeartPulse size={20} /></span>
            <span>
              <strong>Every reading tells a story.</strong>
              <small>Build a clearer picture, one day at a time.</small>
            </span>
          </div>
        </div>

        <span className="visual-footer">A gentler way to track your wellbeing.</span>
        <div className="visual-decoration decoration-one" />
        <div className="visual-decoration decoration-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand brand">
            <span className="brand-icon"><HeartPulse size={21} /></span>
            <span>Sweety</span>
          </div>

          <span className="form-kicker">WELCOME BACK</span>
          <h2>Good to see you.</h2>
          <p className="form-description">
            Sign in to continue your health tracking journey.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email address</label>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            New to Sweety? <Link to="/register">Create an account</Link>
          </p>

          <p className="privacy-note">
            Your readings are personal. Your account keeps them private.
          </p>
        </div>
      </section>
    </main>
  );
}

