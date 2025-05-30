import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notificationConfigs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { NotificationConfig } from '@/types/user';
import { sendNotification } from '@/lib/notifications';
import { sql } from 'drizzle-orm';

interface UpdateNotificationConfigInput {
  userId: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  telegramEnabled?: boolean;
  telegramChatId?: string | null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [config] = await db
      .select({
        id: notificationConfigs.id,
        userId: notificationConfigs.userId,
        emailEnabled: notificationConfigs.emailEnabled,
        smsEnabled: notificationConfigs.smsEnabled,
        telegramEnabled: notificationConfigs.telegramEnabled,
        telegramChatId: notificationConfigs.telegramChatId,
        createdAt: notificationConfigs.createdAt,
        updatedAt: notificationConfigs.updatedAt,
      })
      .from(notificationConfigs)
      .where(eq(notificationConfigs.userId, session.user.id));

    if (!config) {
      return NextResponse.json({ success: false, error: 'Notification config not found' }, { status: 404 });
    }

    const response: NotificationConfig = {
      ...config,
      createdAt: Number(config.createdAt),
      updatedAt: Number(config.updatedAt),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching notification config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, emailEnabled, smsEnabled, telegramEnabled, telegramChatId } = (await request.json()) as UpdateNotificationConfigInput;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (smsEnabled && !user.phoneNumber) {
      return NextResponse.json({ success: false, error: 'Cannot enable SMS without a phone number' }, { status: 400 });
    }

    if (telegramEnabled && !telegramChatId) {
      return NextResponse.json({ success: false, error: 'Cannot enable Telegram without a chat ID' }, { status: 400 });
    }

    const [existingConfig] = await db.select().from(notificationConfigs).where(eq(notificationConfigs.userId, userId));
    if (!existingConfig) {
      return NextResponse.json({ success: false, error: 'Notification config not found' }, { status: 404 });
    }

    const [updatedConfig] = await db
      .update(notificationConfigs)
      .set({
        emailEnabled: emailEnabled ?? existingConfig.emailEnabled,
        smsEnabled: smsEnabled ?? existingConfig.smsEnabled,
        telegramEnabled: telegramEnabled ?? existingConfig.telegramEnabled,
        telegramChatId: telegramChatId ?? existingConfig.telegramChatId,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .where(eq(notificationConfigs.userId, userId))
      .returning();

    await sendNotification({
      userId,
      message: 'Your notification preferences have been updated.',
      type: 'ACCOUNT_MODIFIED',
    });

    const response: NotificationConfig = {
      id: updatedConfig.id,
      userId: updatedConfig.userId,
      emailEnabled: updatedConfig.emailEnabled,
      smsEnabled: updatedConfig.smsEnabled,
      telegramEnabled: updatedConfig.telegramEnabled,
      telegramChatId: updatedConfig.telegramChatId,
      createdAt: Number(updatedConfig.createdAt),
      updatedAt: Number(updatedConfig.updatedAt),
    };

    return NextResponse.json({
      success: true,
      data: {
        message: 'Notification config updated successfully',
        config: response,
      },
    });
  } catch (error) {
    console.error('Error updating notification config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}