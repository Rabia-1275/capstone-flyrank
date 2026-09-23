import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import SettingsForm from './SettingsForm';
import { STORAGE_KEY } from './settingsSchema';

const validForm = {
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  role: 'Developer',
  emailNotifications: true,
  bio: 'Product engineer.',
};

async function fillValidForm(user) {
  await user.clear(screen.getByLabelText(/display name/i));
  await user.type(screen.getByLabelText(/display name/i), validForm.displayName);
  await user.clear(screen.getByLabelText(/^email$/i));
  await user.type(screen.getByLabelText(/^email$/i), validForm.email);
  await user.selectOptions(screen.getByLabelText(/^role$/i), validForm.role);

  const notifications = screen.getByLabelText(/email notifications/i);
  if (validForm.emailNotifications !== notifications.checked) {
    await user.click(notifications);
  }

  await user.clear(screen.getByLabelText(/^bio$/i));
  await user.type(screen.getByLabelText(/^bio$/i), validForm.bio);
}

describe('SettingsForm', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('shows the correct error message for an invalid email', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.type(screen.getByLabelText(/display name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('rejects a bio longer than 200 characters', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await fillValidForm(user);
    await user.clear(screen.getByLabelText(/^bio$/i));
    await user.type(screen.getByLabelText(/^bio$/i), 'a'.repeat(201));
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText('Bio must be 200 characters or fewer')).toBeInTheDocument();
  });

  it('saves valid data to localStorage and shows a success message', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Settings saved successfully.');
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(validForm);
  });

  it('loads saved values after a simulated remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SettingsForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    unmount();
    render(<SettingsForm />);

    expect(screen.getByLabelText(/display name/i)).toHaveValue(validForm.displayName);
    expect(screen.getByLabelText(/^email$/i)).toHaveValue(validForm.email);
    expect(screen.getByLabelText(/^role$/i)).toHaveValue(validForm.role);
    expect(screen.getByLabelText(/email notifications/i)).toBeChecked();
    expect(screen.getByLabelText(/^bio$/i)).toHaveValue(validForm.bio);
  });
});
