import { useAuth } from '../context/useAuth';

import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, CalendarDays, ChartNoAxesCombined, Droplet,
  FileBarChart, LogOut, Plus, Pencil, Trash2,
  TrendingDown, TrendingUp, UserRound,
} from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../api/client';
import AddReadingModal from '../components/AddReadingModal';
import EditReadingModal from '../components/EditReadingModal';
import './Dashboard.css';


const SLOT_LABELS = {
  morning_fasting: 'Morning fasting',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function getLocalDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [report, setReport] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReadingId, setDeletingReadingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [reportResponse, readingsResponse] = await Promise.all([
          api.get('/reports/daily', { params: { date: selectedDate } }),
          api.get('/readings', { params: { date: selectedDate } }),
        ]);

        if (!active) return;
        setReport(reportResponse.data.data);
        setReadings(readingsResponse.data.data || []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message ||
          'Unable to load your readings. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [selectedDate, refreshKey]);

  const chartData = useMemo(() => {
    const order = [
      'morning_fasting', 'after_breakfast',
      'after_lunch', 'after_dinner',
    ];

    return [...readings]
      .sort((a, b) => order.indexOf(a.time_slot) - order.indexOf(b.time_slot))
      .map((reading) => ({
        slot: SLOT_LABELS[reading.time_slot] || reading.time_slot,
        glucose: Number(reading.glucose_value),
      }));
  }, [readings]);

  const completedSlots = new Set(readings.map((item) => item.time_slot));
  const summary = report?.summary || {};

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleReadingSaved(savedDate) {
    setSelectedDate(savedDate);
    setRefreshKey((current) => current + 1);
  }

  async function handleDeleteReading(reading) {
    const slotLabel = SLOT_LABELS[reading.time_slot] || reading.time_slot;
    const confirmed = window.confirm(
      `Are you sure you want to delete the ${slotLabel} reading of ${reading.glucose_value} mg/dL? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingReadingId(reading.id);
    setError('');

    try {
      await api.delete(`/readings/${reading.id}`);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.response?.data?.message ||
        'Unable to delete this reading. Please try again.');
    } finally {
      setDeletingReadingId(null);
    }
  }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="brand">
          <div className="brand-mark"><Droplet size={23} /></div>
          <span>Sweety</span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`}>
            <Activity size={19} /><span>Dashboard</span>
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileBarChart size={19} /><span>Reports</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserRound size={19} /><span>Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-note">
          <div className="sidebar-note-icon"><Droplet size={18} /></div>
          <p>Your health journey, one reading at a time.</p>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} /><span>Sign out</span>
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <div className="eyebrow">YOUR HEALTH OVERVIEW</div>
            <h1>Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
            <p className="dashboard-subtitle">
              A little progress each day adds up.
            </p>
          </div>

          <div className="header-profile">
            <div className="profile-avatar"><UserRound size={20} /></div>
            <div>
              <strong>{user?.name || 'Sweety user'}</strong>
              <span>Personal account</span>
            </div>
          </div>
        </header>

        <div className="dashboard-date-row">
          <div>
            <h2>Your daily snapshot</h2>
            <p>Here's how your day is looking.</p>
          </div>

          <div className="dashboard-actions">
            <label className="date-control">
              <CalendarDays size={17} />
              <input
                type="date"
                value={selectedDate}
                max={getLocalDate()}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>

            <button className="add-reading-button"
              onClick={() => setShowAddModal(true)}>
              <Plus size={18} /><span>Add reading</span>
            </button>
          </div>
        </div>

        {error && <div className="dashboard-error" role="alert">{error}</div>}

        {loading ? (
          <div className="dashboard-loading">Loading your dashboard...</div>
        ) : (
          <>
            <section className="summary-grid">
              <article className="summary-card summary-primary">
                <div className="summary-card-top">
                  <span>Daily average</span>
                  <div className="summary-icon"><Activity size={19} /></div>
                </div>
                <div className="summary-value">
                  {summary.average ?? '—'}
                  <small>{summary.average != null ? 'mg/dL' : ''}</small>
                </div>
                <p>Based on {summary.reading_count || 0} readings</p>
              </article>

              <article className="summary-card">
                <div className="summary-card-top">
                  <span>Highest reading</span>
                  <div className="summary-icon warm"><TrendingUp size={19} /></div>
                </div>
                <div className="summary-value">
                  {summary.highest ?? '—'}
                  <small>{summary.highest != null ? 'mg/dL' : ''}</small>
                </div>
                <p>Today's highest recorded value</p>
              </article>

              <article className="summary-card">
                <div className="summary-card-top">
                  <span>Lowest reading</span>
                  <div className="summary-icon cool"><TrendingDown size={19} /></div>
                </div>
                <div className="summary-value">
                  {summary.lowest ?? '—'}
                  <small>{summary.lowest != null ? 'mg/dL' : ''}</small>
                </div>
                <p>Today's lowest recorded value</p>
              </article>

              <article className="summary-card">
                <div className="summary-card-top">
                  <span>Readings logged</span>
                  <div className="summary-icon">
                    <ChartNoAxesCombined size={19} />
                  </div>
                </div>
                <div className="summary-value">
                  {summary.reading_count || 0}<small>/4</small>
                </div>
                <p>Daily tracking progress</p>
              </article>
            </section>

            <section className="dashboard-content-grid">
              <article className="dashboard-panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Glucose trend</h3>
                    <p>Your readings throughout the day</p>
                  </div>
                  <span className="panel-date">{formatDate(selectedDate)}</span>
                </div>

                {chartData.length > 0 ? (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}
                        margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid stroke="#E9EDE6"
                          strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="slot"
                          tick={{ fill: '#78877E', fontSize: 10 }}
                          axisLine={false} tickLine={false}
                          interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#78877E', fontSize: 11 }}
                          axisLine={false} tickLine={false} width={42} />
                        <Tooltip formatter={(value) =>
                          [`${value} mg/dL`, 'Glucose']}
                          contentStyle={{ borderRadius: 12,
                            border: '1px solid #E6EAE2' }} />
                        <Line type="monotone" dataKey="glucose"
                          stroke="#347C65" strokeWidth={3}
                          dot={{ r: 5, fill: '#347C65',
                            strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="chart-empty">
                    <div className="empty-icon"><Activity size={25} /></div>
                    <strong>No readings for this date yet</strong>
                    <span>Your glucose trend will appear here once readings are added.</span>
                  </div>
                )}
              </article>

              <article className="dashboard-panel slots-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Daily check-ins</h3>
                    <p>Your four daily reading slots</p>
                  </div>
                  <span className="slot-count">{readings.length}/4</span>
                </div>

                <div className="slot-list">
                  {Object.entries(SLOT_LABELS).map(([key, label]) => {
                    const reading = readings.find((item) => item.time_slot === key);
                    return (
                      <div className="slot-item" key={key}>
                        <div className={`slot-dot ${completedSlots.has(key) ? 'done' : ''}`}>
                          {completedSlots.has(key) ? '?' : ''}
                        </div>
                        <div className="slot-name">
                          <strong>{label}</strong>
                          <span>{reading ? 'Recorded' : 'Not recorded yet'}</span>
                        </div>
                        <div className="slot-value">
                          {reading ? reading.glucose_value : '—'}
                          {reading && <small>mg/dL</small>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="slot-footer">
                  <span>{readings.length} of 4 slots completed</span>
                  <div className="progress-track">
                    <div style={{ width: `${(readings.length / 4) * 100}%` }} />
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h3>Today's readings</h3>
                  <p>Your recorded glucose measurements</p>
                </div>
                <span className="panel-date">{readings.length} records</span>
              </div>

              {readings.length > 0 ? (
                <div className="readings-table-wrap">
                  <table className="readings-table">
                    <thead>
                      <tr>
                        <th>Reading slot</th><th>Date</th>
                        <th>Glucose level</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((reading) => (
                        <tr key={reading.id}>
                          <td>{SLOT_LABELS[reading.time_slot] || reading.time_slot}</td>
                          <td>{formatDate(selectedDate)}</td>
                          <td><strong>{reading.glucose_value} mg/dL</strong></td>
                          <td><span className="recorded-badge">Recorded</span></td>
                          <td>
                            <div className="reading-actions">
                              <button type="button" className="edit-reading-button"
                                onClick={() => setEditingReading(reading)}
                                disabled={deletingReadingId !== null}
                                aria-label={`Edit ${SLOT_LABELS[reading.time_slot]} reading`}>
                                <Pencil size={15} />Edit
                              </button>
                              <button type="button" className="delete-reading-button"
                                onClick={() => handleDeleteReading(reading)}
                                disabled={deletingReadingId !== null}
                                aria-label={`Delete ${SLOT_LABELS[reading.time_slot]} reading`}>
                                <Trash2 size={15} />
                                {deletingReadingId === reading.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="recent-empty">
                  No readings recorded for {formatDate(selectedDate)}.
                </div>
              )}
            </section>
          </>
        )}

        <footer className="dashboard-footer">
          Sweety · Your personal glucose tracking companion
        </footer>
      </section>

      {showAddModal && (
        <AddReadingModal onClose={() => setShowAddModal(false)}
          onSaved={handleReadingSaved} />
      )}

      {editingReading && (
        <EditReadingModal reading={editingReading}
          selectedDate={selectedDate}
          onClose={() => setEditingReading(null)}
          onSaved={handleReadingSaved} />
      )}
    </main>
  );
}



