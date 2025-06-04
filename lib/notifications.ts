import { db } from '@/db';
import { users, notificationConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { User } from '@/types/user';

interface Notification {
  userId: string;
  message: string;
  type: 'ACCOUNT_CREATED' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_REACTIVATED' | 'ACCOUNT_DELETED' |
        'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_COMPLETED' |
        'BOOKING_REQUEST' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED' | 'BOOKING_PENDING' | 'BOOKING_MODIFIED' |
        'ROOM_CREATED' | 'ROOM_UPDATED' | 'ROOM_DELETED' | 'ROOM_MODIFIED' | 'ACCOUNT_MODIFIED' |
        'NEW_BOOKING_REQUEST'; // Added this type
}

export async function sendNotification({ userId, message, type }: Notification) {
  try {
    const [user]: User[] = await db.select().from(users).where(eq(users.id, userId));
    const [config] = await db.select().from(notificationConfigs).where(eq(notificationConfigs.userId, userId));

    if (!user || !config) return;

    if (config.emailEnabled) {
      await sendEmail({
        to: user.email,
        subject: `Meeting Room: ${type.replace('_', ' ')}`,
        body: message,
      });
    }

    if (config.smsEnabled && user.phoneNumber) {
      await sendSMS({
        to: user.phoneNumber,
        message,
      });
    } else if (config.smsEnabled) {
      console.warn(`SMS notification not sent for user ${userId}: phoneNumber is missing`);
    }

    if (config.telegramEnabled && config.telegramChatId) {
      await sendTelegram({
        chatId: config.telegramChatId,
        message,
      });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  // Implement email sending logic (e.g., using Nodemailer)
  console.log(`Sending email to ${to}: ${subject} - ${body}`);
}

async function sendSMS({ to, message }: { to: string; message: string }) {
  // Implement SMS sending logic (e.g., using Twilio)
  console.log(`Sending SMS to ${to}: ${message}`);
}

async function sendTelegram({ chatId, message }: { chatId: string; message: string }) {
  // Implement Telegram sending logic (e.g., using Telegram Bot API)
  console.log(`Sending Telegram to ${chatId}: ${message}`);
}
