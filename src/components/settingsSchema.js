import { z } from 'zod';

export const STORAGE_KEY = 'settings';

export const defaultSettings = {
  displayName: '',
  email: '',
  role: 'Developer',
  emailNotifications: false,
  bio: '',
};

export const settingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  role: z.enum(['Developer', 'Designer', 'Manager'], {
    required_error: 'Role is required',
  }),
  emailNotifications: z.boolean(),
  bio: z
    .string()
    .max(200, 'Bio must be 200 characters or fewer'),
});

export function loadSavedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }

    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}
