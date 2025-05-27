import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, toUserResponse } from '@/lib/auth';
import { CreateUserInput, UserRole, UserResponse } from '@/types/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { sendNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || 
        (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const whereClauses = [];
    
    if (session.user.role === 'ADMIN') {
      whereClauses.push(eq(users.role, 'STAFF'));
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isSuspended = searchParams.get('isSuspended');

    if (role) {
      whereClauses.push(eq(users.role, role as UserRole));
    }

    if (isSuspended) {
      const suspended = isSuspended === 'true';
      whereClauses.push(eq(users.isSuspended, suspended));
    }

    const query = db.select()
      .from(users)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);

    const userList = await query;
    const response: UserResponse[] = userList.map(toUserResponse);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only super-admins can create users' },
        { status: 403 }
      );
    }

    const { name, email, role, password } = (await request.json()) as CreateUserInput;

    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    let finalPassword = password;
    if (!password) {
      switch (role) {
        case 'SUPER_ADMIN':
          finalPassword = 'superadmin123';
          break;
        case 'ADMIN':
          finalPassword = 'admin123';
          break;
        case 'STAFF':
          finalPassword = 'staff123';
          break;
      }
    }

    if (!finalPassword) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(finalPassword);
    const userId = crypto.randomUUID();

    const [newUser] = await db.insert(users)
      .values({
        id: userId,
        name,
        email,
        role,
        passwordHash,
        isSuspended: false,
      })
      .returning();

    await sendNotification({
      userId,
      message: `Your account has been created with role ${role}. Please log in with your email and password.`,
      type: 'ACCOUNT_CREATED',
    });

    return NextResponse.json(toUserResponse(newUser), { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}