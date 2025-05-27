import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings as bookingsTable, rooms as roomsTable, users as usersTable } from '@/db/schema';
import { and, eq, gte, lte, or, sql, ne } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Booking, UpdateBookingInput } from '@/types/booking';
//import { sendNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    const whereClause = isAdmin
      ? eq(bookingsTable.id, id)
      : and(eq(bookingsTable.id, id), eq(bookingsTable.userId, session.user.id));

    const [rawBooking] = await db
      .select({
        id: bookingsTable.id,
        userId: bookingsTable.userId,
        userName: usersTable.name,
        roomId: bookingsTable.roomId,
        roomName: roomsTable.name,
        startTime: bookingsTable.startTime,
        endTime: bookingsTable.endTime,
        status: bookingsTable.status,
        equipment: bookingsTable.equipment,
        purpose: bookingsTable.purpose,
        createdAt: bookingsTable.createdAt,
        updatedAt: bookingsTable.updatedAt,
      })
      .from(bookingsTable)
      .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
      .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(whereClause);

    if (!rawBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const booking: Booking = {
      id: rawBooking.id,
      userId: rawBooking.userId,
      userName: rawBooking.userName,
      roomId: rawBooking.roomId,
      roomName: rawBooking.roomName,
      startTime: Number(rawBooking.startTime),
      endTime: Number(rawBooking.endTime),
      status: rawBooking.status,
      equipment: JSON.parse(rawBooking.equipment || '[]'),
      purpose: rawBooking.purpose ?? undefined,
      createdAt: Number(rawBooking.createdAt),
      updatedAt: Number(rawBooking.updatedAt),
    };

    return NextResponse.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { startTime, endTime, equipment, purpose, status } = (await request.json()) as UpdateBookingInput;
    if (!startTime && !endTime && !equipment && !purpose && !status) {
      return NextResponse.json({ success: false, error: 'At least one field is required' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const whereClause = isAdmin
      ? eq(bookingsTable.id, id)
      : and(eq(bookingsTable.id, id), eq(bookingsTable.userId, session.user.id));

    const [existingBooking] = await db.select().from(bookingsTable).where(whereClause);
    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found or unauthorized' }, { status: 404 });
    }

    if (startTime && endTime && endTime <= startTime) {
      return NextResponse.json({ success: false, error: 'End time must be after start time' }, { status: 400 });
    }

    if ((startTime || endTime) && existingBooking.status === 'APPROVED') {
      const newStartTime = new Date(startTime ?? Number(existingBooking.startTime));
      const newEndTime = new Date(endTime ?? Number(existingBooking.endTime));

      const conflictingBookings = await db
        .select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.roomId, existingBooking.roomId),
            or(
              and(
                gte(bookingsTable.startTime, newStartTime),
                lte(bookingsTable.startTime, newEndTime)
              ),
              and(
                gte(bookingsTable.endTime, newStartTime),
                lte(bookingsTable.endTime, newEndTime)
              ),
              and(
                lte(bookingsTable.startTime, newStartTime),
                gte(bookingsTable.endTime, newEndTime)
              )
            ),
            eq(bookingsTable.status, 'APPROVED'),
            ne(bookingsTable.id, id) // Exclude the current booking
          )
        );

      if (conflictingBookings.length > 0) {
        return NextResponse.json({ success: false, error: 'Room is already booked for the requested time' }, { status: 400 });
      }
    }

    if (status && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Only admins can update booking status' }, { status: 403 });
    }

    const [rawBooking] = await db
      .update(bookingsTable)
      .set({
        startTime: startTime ? new Date(startTime) : existingBooking.startTime,
        endTime: endTime ? new Date(endTime) : existingBooking.endTime,
        equipment: equipment ? JSON.stringify(equipment) : existingBooking.equipment,
        purpose: purpose ?? existingBooking.purpose,
        status: status ?? existingBooking.status,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .where(whereClause)
      .returning();

    const [room] = await db.select({ name: roomsTable.name }).from(roomsTable).where(eq(roomsTable.id, rawBooking.roomId));
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, rawBooking.userId));

    const updatedBooking: Booking = {
      id: rawBooking.id,
      userId: rawBooking.userId,
      userName: user.name,
      roomId: rawBooking.roomId,
      roomName: room.name,
      startTime: Number(rawBooking.startTime),
      endTime: Number(rawBooking.endTime),
      status: rawBooking.status,
      equipment: JSON.parse(rawBooking.equipment || '[]'),
      purpose: rawBooking.purpose ?? undefined,
      createdAt: Number(rawBooking.createdAt),
      updatedAt: Number(rawBooking.updatedAt),
    };

    const notificationType = status
      ? `BOOKING_${status.toUpperCase()}` as 'BOOKING_PENDING' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED'
      : 'BOOKING_MODIFIED';

    // await sendNotification({
    //   userId: session.user.id,
    //   message: `Booking for room "${room.name}" has been updated.`,
    //   type: notificationType,
    // });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Booking updated successfully',
        booking: updatedBooking,
      },
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    const whereClause = isAdmin
      ? eq(bookingsTable.id, id)
      : and(eq(bookingsTable.id, id), eq(bookingsTable.userId, session.user.id));

    const [booking] = await db
      .select({ userId: bookingsTable.userId, roomId: bookingsTable.roomId })
      .from(bookingsTable)
      .where(whereClause);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found or unauthorized' }, { status: 404 });
    }

    const [room] = await db.select({ name: roomsTable.name }).from(roomsTable).where(eq(roomsTable.id, booking.roomId));

    await db.delete(bookingsTable).where(whereClause);

    // await sendNotification({
    //   userId: session.user.id,
    //   message: `Booking for room "${room.name}" has been cancelled.`,
    //   type: 'BOOKING_CANCELLED',
    // });

    return NextResponse.json({
      success: true,
      data: { message: 'Booking cancelled successfully' },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 });
  }
}