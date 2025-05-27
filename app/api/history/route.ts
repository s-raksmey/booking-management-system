import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings as bookingsTable, rooms as roomsTable } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import type { SQL } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const room = searchParams.get('room');

    // Build conditions array
    const conditions: SQL[] = [eq(bookingsTable.userId, session.user.id)];

    if (date) {
      const parsedDate = new Date(date);
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      conditions.push(
        and(
          gte(bookingsTable.startTime, startOfDay),
          lte(bookingsTable.endTime, endOfDay)
        )!
      );
    }

    if (room) {
      conditions.push(eq(roomsTable.name, room));
    }

    // Apply all conditions in a single where clause
    const query = db
      .select({
        id: bookingsTable.id,
        roomName: roomsTable.name,
        startTime: bookingsTable.startTime,
        endTime: bookingsTable.endTime,
        status: bookingsTable.status,
      })
      .from(bookingsTable)
      .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const bookings = await query;
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    await db.delete(bookingsTable).where(eq(bookingsTable.id, id));
    return NextResponse.json({ message: 'Booking cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
};