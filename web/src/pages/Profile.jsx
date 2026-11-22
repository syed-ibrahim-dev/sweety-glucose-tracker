import { useAuth } from '../context/useAuth';


import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Droplet,
  FileBarChart,
  LogOut,
  Save,
  UserRound,
  Mail,
  ShieldCheck,
  LockKeyhole,
  KeyRound,
} from 'lucide-react';
import api from '../api/client';
import './Dashboard.css';
import './Profile.css';


export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/profile');
        const profile = response.data.data.user;

        if (!active) return;

        setName(profile.name || '');
        setEmail(profile.email || '');
        updateUser(profile);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          'Unable to load your profile. Please try again.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [updateUser]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSaving(true);

    try {
      const response = await api.put('/profile', {
        name: trimmedName,
        email: trimmedEmail,
      });

      const updatedProfile = response.data.data.user;

      updateUser(updatedProfile);
      setName(updatedProfile.name);
      setEmail(updatedProfile.email);
      setSuccess('Your profile has been updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword.length > 72) {
      setPasswordError('New password must not exceed 72 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Your password has been changed successfully.');
    } catch (err) {
      setPasswordError(
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        'Unable to change your password. Please try again.'
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <main className="dashboard-page profile-layout">
      <aside className="dashboard-sidebar">
        <div className="brand">
          <div className="brand-mark"><Droplet size={23} /></div>
          <span>Sweety</span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`}>
            <Activity size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileBarChart size={19} />
            <span>Reports</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserRound size={19} />
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-note">
          <div className="sidebar-note-icon"><Droplet size={18} /></div>
          <p>Your health journey, one reading at a time.</p>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </aside>

      <section className="dashboard-main profile-main">
        <header className="profile-page-header">
          <div>
            <div className="eyebrow">ACCOUNT SETTINGS</div>
            <h1>My Profile</h1>
            <p className="dashboard-subtitle">
              Manage your personal account information.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="dashboard-loading">Loading your profile...</div>
        ) : (
          <div className="profile-content">
            <section className="profile-card">
              <div className="profile-card-heading">
                <div className="profile-large-avatar">
                  <UserRound size={30} />
                </div>
                <div>
                  <h2>{name || 'Your profile'}</h2>
                  <p>{email || 'Your account email'}</p>
                </div>
              </div>

              <div className="profile-account-status">
                <ShieldCheck size={17} />
                <span>Authenticated account</span>
              </div>

              <div className="profile-divider" />

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-section-heading">
                  <h3>Personal information</h3>
                  <p>Update the details associated with your account.</p>
                </div>

                <label className="profile-field">
                  <span>Full name</span>
                  <div className="profile-input-wrap">
                    <UserRound size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError('');
                        setSuccess('');
                      }}
                      placeholder="Enter your full name"
                      maxLength={100}
                      autoComplete="name"
                      required
                    />
                  </div>
                </label>

                <label className="profile-field">
                  <span>Email address</span>
                  <div className="profile-input-wrap">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError('');
                        setSuccess('');
                      }}
                      placeholder="Enter your email address"
                      maxLength={255}
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                {error && (
                  <div className="profile-message profile-message-error"
                    role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="profile-message profile-message-success"
                    role="status">
                    {success}
                  </div>
                )}

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={saving}
                  >
                    <Save size={17} />
                    <span>{saving ? 'Saving changes...' : 'Save changes'}</span>
                  </button>
                </div>
              </form>
            </section>

            <section className="profile-card password-card">
              <div className="profile-section-heading">
                <div className="password-heading-icon">
                  <LockKeyhole size={21} />
                </div>
                <h3>Change password</h3>
                <p>Update your password to keep your account secure.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <label className="profile-field">
                  <span>Current password</span>
                  <div className="profile-input-wrap">
                    <KeyRound size={18} />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value);
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </label>

                <label className="profile-field">
                  <span>New password</span>
                  <div className="profile-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                      placeholder="Enter new password"
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <small className="password-hint">
                    Use between 8 and 72 characters.
                  </small>
                </label>

                <label className="profile-field">
                  <span>Confirm new password</span>
                  <div className="profile-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                      placeholder="Confirm new password"
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </label>

                {passwordError && (
                  <div className="profile-message profile-message-error"
                    role="alert">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="profile-message profile-message-success"
                    role="status">
                    {passwordSuccess}
                  </div>
                )}

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={passwordSaving}
                  >
                    <LockKeyhole size={17} />
                    <span>
                      {passwordSaving ? 'Updating password...' : 'Update password'}
                    </span>
                  </button>
                </div>
              </form>
            </section>

            <section className="profile-info-card">
              <div className="profile-info-icon">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h3>Your account is protected</h3>
                <p>
                  Your profile information is available only to your authenticated
                  account. Your glucose readings remain private to your account.
                </p>
              </div>
            </section>
          </div>
        )}

        <footer className="dashboard-footer">
          Sweety Â· Your personal glucose tracking companion
        </footer>
      </section>
    </main>
  );
}

