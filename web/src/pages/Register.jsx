
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, HeartPulse, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please complete all fields.');
      return;
    }

    if (form.password.length < 8) {
      setError('Your password must contain at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to create your account. Please try again.'
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
          <span className="eyebrow">A FRESH START</span>
          <h1>Your health<br />journey, <em>made simpler.</em></h1>
          <p>
            Create a personal space for your glucose readings.
            Stay organised and follow your records over time.
          </p>
          <div className="visual-note">
            <span className="note-icon"><HeartPulse size={20} /></span>
            <span>
              <strong>One account. Your own records.</strong>
              <small>Your readings stay linked to your account.</small>
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

          <span className="form-kicker">GET STARTED</span>
          <h2>Create your account.</h2>
          <p className="form-description">
            A few details are all you need to get started.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="name">Your name</label>
            <div className="input-wrap">
              <UserRound size={18} />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

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
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className="privacy-note">
            By creating an account, you can securely manage your own readings.
          </p>
        </div>
      </section>
    </main>
  );
}

