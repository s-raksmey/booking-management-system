// app/api/admin/bookings/history/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, rooms, users } from '@/db/schema';
import { and, eq, gte, lte, like, sql, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const date = searchParams.get('date');
    const room = searchParams.get('room');
    const user = searchParams.get('user');

    const offset = (page - 1) * limit;

    const conditions = [];

    if (date) {
      const parsedDate = new Date(date);
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      conditions.push(
        and(
          gte(bookings.startTime, startOfDay),
          lte(bookings.endTime, endOfDay)
        )
      );
    }

    if (room) {
      conditions.push(like(rooms.name, `%${room}%`));
    }

    if (user) {
      conditions.push(
        or(
          like(users.name, `%${user}%`),
          like(users.email, `%${user}%`)
        )
      );
    }

    const query = db
      .select({
        id: bookings.id,
        roomName: rooms.name,
        userName: users.name,
        userEmail: users.email,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(bookings.createdAt)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const [bookingsData, totalCount] = await Promise.all([query, countQuery]);

    return NextResponse.json({
      success: true,
      data: bookingsData.map((booking) => ({
        ...booking,
        startTime: Number(booking.startTime),
        endTime: Number(booking.endTime),
        createdAt: Number(booking.createdAt),
      })),
      total: totalCount[0].count,
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}