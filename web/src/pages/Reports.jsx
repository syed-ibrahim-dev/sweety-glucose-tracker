import { useAuth } from '../context/useAuth';


import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, CalendarDays, ChartNoAxesCombined, Droplet,
  Download, FileBarChart, LogOut, TrendingDown, TrendingUp, UserRound,
} from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../api/client';
import './Dashboard.css';
import './Reports.css';


const REPORT_OPTIONS = [
  { value: 'daily', label: 'Daily Report', exportType: 'daily' },
  { value: 'month-to-date', label: 'Month to Date', exportType: 'month_to_date' },
  { value: 'previous-month', label: 'Previous Month', exportType: 'previous_month' },
];

const SLOT_LABELS = {
  morning_fasting: 'Morning fasting',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function getToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return '--';
  return new Date(`${String(dateString).slice(0, 10)}T00:00:00`)
    .toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
}

export default function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  // CSV export states
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchReport() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/reports/${reportType}`, {
          params: { date: selectedDate },
        });

        if (active) setReport(response.data.data);
      } catch (err) {
        if (!active) return;
        setReport(null);
        setError(err.response?.data?.message ||
          'Unable to load this report. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchReport();
    return () => { active = false; };
  }, [reportType, selectedDate, retryKey]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Download the currently selected report as CSV
  async function handleExportCsv() {
    setExporting(true);
    setExportError('');

    try {
      const selectedOption = REPORT_OPTIONS.find(
        (option) => option.value === reportType
      );

      const response = await api.get('/reports/export', {
        params: {
          type: selectedOption.exportType,
          date: selectedDate,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'text/csv;charset=utf-8',
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `sweety-${selectedOption.exportType}-${report.start_date}-to-${report.end_date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch {
  setExportError(
    'Unable to export CSV. Please try again.'
  );
    } finally {
      setExporting(false);
    }
  }

  const readings = useMemo(() => report?.readings || [], [report]);
  const summary = report?.summary || {};

  const chartData = useMemo(() => {
    const slotOrder = [
      'morning_fasting', 'after_breakfast',
      'after_lunch', 'after_dinner',
    ];

    return [...readings]
      .sort((a, b) => {
        const dateA = String(a.reading_date).slice(0, 10);
        const dateB = String(b.reading_date).slice(0, 10);
        const dateCompare = dateA.localeCompare(dateB);
        if (dateCompare !== 0) return dateCompare;
        return slotOrder.indexOf(a.time_slot) -
          slotOrder.indexOf(b.time_slot);
      })
      .map((reading) => ({
        label: reportType === 'daily'
          ? SLOT_LABELS[reading.time_slot] || reading.time_slot
          : new Date(`${String(reading.reading_date).slice(0, 10)}T00:00:00`)
              .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        glucose: Number(reading.glucose_value),
      }));
  }, [readings, reportType]);

  const periodLabel = report?.start_date && report?.end_date
   ? `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`
    : 'Selected reporting period';

  return (
    <main className="dashboard-page reports-layout">
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

      <section className="dashboard-main reports-main">
        <header className="dashboard-header reports-header">
          <div>
            <div className="eyebrow">YOUR HEALTH JOURNAL</div>
            <h1>Reports &amp; Insights</h1>
            <p className="dashboard-subtitle">
              Understand your glucose readings over time.
            </p>
          </div>

          <div className="header-profile">
            <div className="profile-avatar"><FileBarChart size={20} /></div>
            <div>
              <strong>{user?.name || 'Sweety user'}</strong>
              <span>Personal account</span>
            </div>
          </div>
        </header>

        <div className="reports-controls">
          <div>
            <h2>Glucose reports</h2>
            <p>Choose a period to explore your readings.</p>
          </div>

          <label className="report-date-control">
            <CalendarDays size={17} />
            <span className="sr-only">Report reference date</span>
            <input type="date" value={selectedDate}
              max={getToday()}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setExportError('');
              }} />
          </label>
        </div>

        <div className="report-tabs" role="tablist" aria-label="Report period">
          {REPORT_OPTIONS.map((option) => (
            <button key={option.value} type="button" role="tab"
              aria-selected={reportType === option.value}
              className={`report-tab ${reportType === option.value ? 'active' : ''}`}
              onClick={() => {
                setReportType(option.value);
                setExportError('');
              }}>
              {option.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="reports-state">
            <div className="reports-loader" />
            <p>Preparing your report...</p>
          </div>
        ) : error ? (
          <div className="reports-state reports-error" role="alert">
            <p>{error}</p>
            <button type="button"
              onClick={() => setRetryKey((current) => current + 1)}>
              Try again
            </button>
          </div>
        ) : report ? (
          <>
            <div className="report-period">
              <div>
                <span>REPORTING PERIOD</span>
                <strong>{periodLabel}</strong>
              </div>

              <div className="report-period-actions">
                <span className="report-period-tag">
                  {REPORT_OPTIONS.find((item) => item.value === reportType)?.label}
                </span>

                <button
                  type="button"
                  className="report-export-button"
                  onClick={handleExportCsv}
                  disabled={exporting || loading}
                >
                  <Download size={17} />
                  <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {exportError && (
              <div className="report-export-error" role="alert">
                {exportError}
              </div>
            )}

            <section className="report-summary-grid">
              <article className="report-summary-card">
                <div className="report-card-top">
                  <span>Total readings</span>
                  <div className="report-card-icon"><Activity size={19} /></div>
                </div>
                <strong>{summary.reading_count ?? 0}</strong>
                <small>Recorded measurements</small>
              </article>

              <article className="report-summary-card">
                <div className="report-card-top">
                  <span>Average</span>
                  <div className="report-card-icon">
                    <ChartNoAxesCombined size={19} />
                  </div>
                </div>
                <strong>{summary.average ?? '--'}</strong>
                <small>mg/dL average</small>
              </article>

              <article className="report-summary-card">
                <div className="report-card-top">
                  <span>Highest</span>
                  <div className="report-card-icon report-high-icon">
                    <TrendingUp size={19} />
                  </div>
                </div>
               <strong>{summary.highest ?? '--'}</strong>
                <small>mg/dL highest reading</small>
              </article>

              <article className="report-summary-card">
                <div className="report-card-top">
                  <span>Lowest</span>
                  <div className="report-card-icon report-low-icon">
                    <TrendingDown size={19} />
                  </div>
                </div>
                <strong>{summary.lowest ?? '--'}</strong>
                <small>mg/dL lowest reading</small>
              </article>
            </section>

            <section className="report-chart-card">
              <div className="report-section-heading">
                <div>
                  <h2>Glucose trend</h2>
                  <p>Your recorded measurements during this period</p>
                </div>
                <span className="report-unit">mg/dL</span>
              </div>

              {chartData.length === 0 ? (
                <div className="report-empty-chart">
                  <Droplet size={28} />
                  <strong>No readings to chart</strong>
                  <span>Add readings to see your glucose trend.</span>
                </div>
              ) : (
                <div className="report-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}
                      margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 5"
                        vertical={false} stroke="#e8e9e2" />
                      <XAxis dataKey="label"
                        tick={{ fill: '#7c8981', fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#7c8981', fontSize: 11 }}
                        axisLine={false} tickLine={false} width={42} />
                      <Tooltip formatter={(value) =>
                        [`${value} mg/dL`, 'Glucose']}
                        contentStyle={{ borderRadius: 12,
                          border: '1px solid #e5e9e1', fontSize: 12 }} />
                      <Line type="monotone" dataKey="glucose"
                        stroke="#347c65" strokeWidth={3}
                        dot={{ r: 4, fill: '#347c65',
                          stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="report-readings-card">
              <div className="report-section-heading">
                <div>
                  <h2>Reading history</h2>
                  <p>{readings.length} measurements in this report</p>
                </div>
              </div>

              {readings.length === 0 ? (
                <div className="report-empty-table">
                  No readings were recorded during this period.
                </div>
              ) : (
                <div className="report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Reading time</th><th>Glucose value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((reading) => (
                        <tr key={reading.id}>
                          <td>{formatDate(reading.reading_date)}</td>
                          <td>{SLOT_LABELS[reading.time_slot] || reading.time_slot}</td>
                          <td>
                            <span className="report-glucose-value">
                              <Droplet size={15} />
                              {reading.glucose_value} mg/dL
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}

        <footer className="dashboard-footer">
          Sweety Â· Your personal glucose tracking companion
        </footer>
      </section>
    </main>
  );
}


