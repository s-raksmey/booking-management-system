'use client';

import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/hooks/useNotification';

const NotificationSettings: React.FC = () => {
  const { data: session } = useSession();
  const { config, loading, error, formData, setFormData, updateNotificationConfig } = useNotification();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationConfig();
  };

  if (!session) {
    return <div>Please log in to manage notification settings.</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div>Loading...</div>}
      {config && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="emailEnabled"
                checked={formData.emailEnabled}
                onChange={handleInputChange}
                className="mr-2"
                disabled={session.user.role !== 'SUPER_ADMIN'}
              />
              Enable Email Notifications
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="smsEnabled"
                checked={formData.smsEnabled}
                onChange={handleInputChange}
                className="mr-2"
                disabled={session.user.role !== 'SUPER_ADMIN'}
              />
              Enable SMS Notifications
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="telegramEnabled"
                checked={formData.telegramEnabled}
                onChange={handleInputChange}
                className="mr-2"
                disabled={session.user.role !== 'SUPER_ADMIN'}
              />
              Enable Telegram Notifications
            </label>
          </div>
          <div>
            <label className="block mb-1">Telegram Chat ID</label>
            <input
              type="text"
              name="telegramChatId"
              value={formData.telegramChatId || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter Telegram Chat ID"
              disabled={session.user.role !== 'SUPER_ADMIN'}
            />
          </div>
          {session.user.role === 'SUPER_ADMIN' && (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </form>
      )}
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Recent Booking Notifications</h3>
        <p>Notifications for booking requests and cancellations will appear here.</p>
      </div>
    </div>
  );
};

export default NotificationSettings;
