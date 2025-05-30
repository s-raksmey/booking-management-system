'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { NotificationConfig } from '@/types/user';

interface BookingNotification {
  id: string;
  userId: string;
  message: string;
  type: 'BOOKING_REQUEST' | 'BOOKING_CANCELLATION';
  createdAt: number;
}

interface UseNotificationReturn {
  config: NotificationConfig | null;
  loading: boolean;
  error: string | null;
  formData: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    telegramEnabled: boolean;
    telegramChatId: string | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    telegramEnabled: boolean;
    telegramChatId: string | null;
  }>>;
  fetchNotificationConfig: () => Promise<void>;
  updateNotificationConfig: () => Promise<void>;
}

export const useNotification = (): UseNotificationReturn => {
  const { data: session } = useSession();
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    telegramEnabled: boolean;
    telegramChatId: string | null;
  }>({
    emailEnabled: true,
    smsEnabled: false,
    telegramEnabled: false,
    telegramChatId: null,
  });

  // Fetch notification configuration
  const fetchNotificationConfig = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
        setFormData({
          emailEnabled: result.data.emailEnabled,
          smsEnabled: result.data.smsEnabled,
          telegramEnabled: result.data.telegramEnabled,
          telegramChatId: result.data.telegramChatId,
        });
      } else {
        setError(result.error || 'Failed to fetch notification settings');
      }
    } catch (err) {
      setError('An error occurred while fetching notification settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update notification configuration
  const updateNotificationConfig = async () => {
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      toast.error('Unauthorized to update settings');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          ...formData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setConfig(result.data.config);
        toast.success(result.data.message);
      } else {
        setError(result.error || 'Failed to update notification settings');
        toast.error(result.error || 'Failed to update notification settings');
      }
    } catch (err) {
      setError('An error occurred while updating notification settings');
      toast.error('An error occurred while updating notification settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate receiving booking notifications (e.g., via WebSocket or polling)
  useEffect(() => {
    if (!session?.user?.id || !config) return;

    const fetchBookingNotifications = async () => {
      try {
        const response = await fetch('/api/bookings/notifications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (result.success && result.data) {
          result.data.forEach((notification: BookingNotification) => {
            if (notification.type === 'BOOKING_REQUEST' && config.emailEnabled) {
              toast.info(`New booking request: ${notification.message}`);
            } else if (notification.type === 'BOOKING_CANCELLATION' && config.emailEnabled) {
              toast.warn(`Booking cancelled: ${notification.message}`);
            }
            if (notification.type === 'BOOKING_REQUEST' && config.smsEnabled && config.telegramChatId) {
              toast.info(`SMS Notification: ${notification.message}`);
            }
            if (notification.type === 'BOOKING_CANCELLATION' && config.telegramEnabled && config.telegramChatId) {
              toast.warn(`Telegram Notification: ${notification.message}`);
            }
          });
        }
      } catch (err) {
        console.error('Error fetching booking notifications:', err);
      }
    };

    const interval = setInterval(fetchBookingNotifications, 30000);

    fetchNotificationConfig();

    return () => clearInterval(interval);
  }, [session, config]);

  // Fetch notification config on mount
  useEffect(() => {
    fetchNotificationConfig();
  }, [session]);

  return {
    config,
    loading,
    error,
    formData,
    setFormData,
    fetchNotificationConfig,
    updateNotificationConfig,
  };
};