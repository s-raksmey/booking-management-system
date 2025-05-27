import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { toUserResponse } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { sendNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params;
    
    if (!session?.user?.role || 
        (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (session.user.role === 'ADMIN' && existingUser.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Unauthorized - Admins can only manage staff users' },
        { status: 403 }
      );
    }

    const { isSuspended } = await request.json();

    const [updatedUser] = await db.update(users)
      .set({
        isSuspended,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    await sendNotification({
      userId,
      message: `Your account has been ${isSuspended ? 'suspended' : 'reactivated'}.`,
      type: isSuspended ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
    });

    return NextResponse.json(toUserResponse(updatedUser));
  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}