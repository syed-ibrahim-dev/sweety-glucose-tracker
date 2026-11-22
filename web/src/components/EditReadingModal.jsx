
import { useState } from 'react';
import { X, Droplet } from 'lucide-react';
import api from '../api/client';

const SLOT_LABELS = {
  morning_fasting: 'Morning fasting',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function getLocalToday() {
  const now = new Date();

  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function EditReadingModal({
  reading,
  selectedDate,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    reading_date: selectedDate,
    time_slot: reading.time_slot,
    glucose_value: String(reading.glucose_value),
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const today = getLocalToday();

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const value = Number(form.glucose_value);

    if (!form.time_slot) {
      setError('Please select a reading time.');
      return;
    }

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setError('Enter a whole number between 40 and 600 mg/dL.');
      return;
    }

    setSaving(true);

    try {
      await api.put(`/readings/${reading.id}`, {
        reading_date: form.reading_date,
        time_slot: form.time_slot,
        glucose_value: value,
      });

      onSaved(form.reading_date);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update this reading. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="reading-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-reading-title"
      >
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">DAILY TRACKING</span>
            <h2 id="edit-reading-title">Edit reading</h2>
            <p>Update your glucose measurement.</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <label className="modal-label">
            Reading date
            <input
              type="date"
              name="reading_date"
              value={form.reading_date}
              max={today}
              onChange={handleChange}
              required
            />
          </label>

          <label className="modal-label">
            Reading time
            <select
              name="time_slot"
              value={form.time_slot}
              onChange={handleChange}
              required
            >
              <option value="">Select a time slot</option>
              {Object.entries(SLOT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-label">
            Glucose value (mg/dL)
            <div className="glucose-input-wrap">
              <Droplet size={19} />
              <input
                type="number"
                name="glucose_value"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 110"
                value={form.glucose_value}
                onChange={handleChange}
                required
              />
              <span>mg/dL</span>
            </div>
          </label>

          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-save"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update reading'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
