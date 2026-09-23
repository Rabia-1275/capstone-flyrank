import { useState } from 'react';

const defaultSettings = {
  displayName: '',
  email: '',
  role: 'developer',
  notifications: true,
  bio: '',
};

const roleOptions = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'manager', label: 'Manager' },
];

function validateSettings(values) {
  const errors = {};

  if (!values.displayName.trim()) {
    errors.displayName = 'Display name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.bio.length > 200) {
    errors.bio = 'Bio must be 200 characters or fewer.';
  }

  return errors;
}

export default function SettingsForm({ initialValues = defaultSettings, onSave }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateSettings(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus(null);
      return;
    }

    onSave?.(values);
    setStatus('Settings saved successfully.');
  }

  function handleReset() {
    setValues(initialValues);
    setErrors({});
    setStatus(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={values.displayName}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Jane Doe"
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="jane@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={values.role}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          {roleOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          id="notifications"
          name="notifications"
          type="checkbox"
          checked={values.notifications}
          onChange={handleChange}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        <div>
          <label htmlFor="notifications" className="block text-sm font-medium text-slate-700">
            Email notifications
          </label>
          <p className="text-sm text-slate-500">
            Receive updates about project activity and reminders.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-slate-700">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={values.bio}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Tell us a little about yourself."
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.bio ? (
            <p className="text-sm text-red-600">{errors.bio}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-slate-500">{values.bio.length}/200</p>
        </div>
      </div>

      {status && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Save settings
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
