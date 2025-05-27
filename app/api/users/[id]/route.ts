import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { toUserResponse } from '@/lib/auth';
import { UpdateUserInput } from '@/types/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
//import { sendNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || 
        (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
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

    const { name, email, role, isSuspended } = (await request.json()) as UpdateUserInput;

    if (role && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super-admins can change user roles' },
        { status: 403 }
      );
    }

    if (email && email !== existingUser.email) {
      const [userWithEmail] = await db.select().from(users).where(eq(users.email, email));
      if (userWithEmail) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    const [updatedUser] = await db.update(users)
      .set({
        name: name ?? existingUser.name,
        email: email ?? existingUser.email,
        role: role ?? existingUser.role,
        isSuspended: isSuspended ?? existingUser.isSuspended,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // if (isSuspended !== undefined && isSuspended !== existingUser.isSuspended) {
    //   await sendNotification({
    //     userId,
    //     message: `Your account has been ${isSuspended ? 'suspended' : 'reactivated'}.`,
    //     type: isSuspended ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
    //   });
    // }

    return NextResponse.json(toUserResponse(updatedUser));
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params;

    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only super-admins can delete users' },
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

    await db.delete(users).where(eq(users.id, userId));

    // await sendNotification({
    //   userId,
    //   message: 'Your account has been deleted.',
    //   type: 'ACCOUNT_DELETED',
    // });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}