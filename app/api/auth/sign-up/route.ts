import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateToken, toUserResponse } from '@/lib/auth';
import { LoginInput, AuthResponse } from '@/types/user';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as LoginInput;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Account is suspended' },
        { status: 403 }
      );
    }

    const passwordValid = await verifyPassword(user.passwordHash, password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await generateToken(user);

    let redirectTo = '/dashboard';
    if (user.role === 'SUPER_ADMIN') {
      redirectTo = '/super-admin';
    } else if (user.role === 'ADMIN') {
      redirectTo = '/admin';
    } else if (user.role === 'STAFF') {
      redirectTo = '/staff';
    }

    const response: AuthResponse = {
      user: toUserResponse(user),
      token,
      redirectTo
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}