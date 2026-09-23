import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadSavedSettings, settingsSchema, STORAGE_KEY } from './settingsSchema';

const roleOptions = ['Developer', 'Designer', 'Manager'];

const inputClassName =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';

export default function SettingsForm() {
  const [savedValues, setSavedValues] = useState(() => loadSavedSettings());
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: savedValues,
  });

  const bioValue = watch('bio') ?? '';

  useEffect(() => {
    const loaded = loadSavedSettings();
    setSavedValues(loaded);
    reset(loaded);
  }, [reset]);

  function onSubmit(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedValues(data);
    setSuccessMessage('Settings saved successfully.');
  }

  function handleReset() {
    reset(savedValues);
    setSuccessMessage('');
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          {...register('displayName')}
          className={inputClassName}
          placeholder="Jane Doe"
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="text"
          {...register('email')}
          className={inputClassName}
          placeholder="jane@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role"
          {...register('role')}
          className={`${inputClassName} bg-white`}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          id="emailNotifications"
          type="checkbox"
          {...register('emailNotifications')}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        <div>
          <label htmlFor="emailNotifications" className="block text-sm font-medium text-slate-700">
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
          rows={4}
          {...register('bio')}
          className={inputClassName}
          placeholder="Tell us a little about yourself."
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.bio ? (
            <p className="text-sm text-red-600">{errors.bio.message}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-slate-500">{bioValue.length}/200</p>
        </div>
      </div>

      {successMessage && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
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
