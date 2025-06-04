import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings as bookingsTable, rooms as roomsTable, users as usersTable, recurringBookings } from '@/db/schema';
import { and, eq, gte, lte, or, sql, inArray } from 'drizzle-orm'; // Added inArray
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Booking, CreateBookingInput } from '@/types/booking';
import { sendNotification } from '@/lib/notifications';

const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
type BookingStatus = typeof validStatuses[number];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const conditions = [];

    if (date) {
      const parsedDate = new Date(date);
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      conditions.push(
        gte(bookingsTable.startTime, startOfDay),
        lte(bookingsTable.endTime, endOfDay)
      );
    }

    if (roomId) {
      conditions.push(eq(bookingsTable.roomId, roomId));
    }

    if (status && validStatuses.includes(status as BookingStatus)) {
      conditions.push(eq(bookingsTable.status, status as BookingStatus));
    }

    // Modified logic:
    // If not an admin, always filter by the current user's ID.
    // If an admin and a specific userId is provided, filter by that userId.
    // If an admin and no userId is provided, do not filter by userId (allowing them to see all bookings).
    if (!isAdmin) {
      conditions.push(eq(bookingsTable.userId, session.user.id));
    } else if (userId) {
      conditions.push(eq(bookingsTable.userId, userId));
    }


    const query = db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset((page - 1) * limit);

    const rawBookings = await query;
    const [totalCount] = await db
      .select({ count: sql`count(*)` })
      .from(bookingsTable)
      .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
      .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const bookings: Booking[] = rawBookings.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      userName: booking.userName,
      roomId: booking.roomId,
      roomName: booking.roomName,
      startTime: Number(booking.startTime),
      endTime: Number(booking.endTime),
      status: booking.status,
      equipment: JSON.parse(booking.equipment || '[]'),
      purpose: booking.purpose ?? undefined,
      createdAt: Number(booking.createdAt),
      updatedAt: Number(booking.updatedAt),
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: bookings,
        total: Number(totalCount.count),
        page,
        limit,
        totalPages: Math.ceil(Number(totalCount.count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, startTime, endTime, equipment, purpose, recurring } = (await request.json()) as CreateBookingInput;
    if (!roomId || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (endTime <= startTime) {
      return NextResponse.json({ success: false, error: 'End time must be after start time' }, { status: 400 });
    }

    const [room] = await db
      .select({ autoApprove: roomsTable.autoApprove, name: roomsTable.name })
      .from(roomsTable)
      .where(eq(roomsTable.id, roomId));

    if (!room) {
      return NextResponse.json({ success: false, error: 'Invalid room selected' }, { status: 400 });
    }

    // Check for booking conflicts
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const conflictingBookings = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.roomId, roomId),
          or(
            and(
              gte(bookingsTable.startTime, startDate),
              lte(bookingsTable.startTime, endDate)
            ),
            and(
              gte(bookingsTable.endTime, startDate),
              lte(bookingsTable.endTime, endDate)
            ),
            and(
              lte(bookingsTable.startTime, startDate),
              gte(bookingsTable.endTime, endDate)
            )
          ),
          eq(bookingsTable.status, 'APPROVED')
        )
      );

    if (conflictingBookings.length > 0) {
      return NextResponse.json({ success: false, error: 'Room is already booked for the requested time' }, { status: 400 });
    }

    const [newBooking] = await db
      .insert(bookingsTable)
      .values({
        id: crypto.randomUUID(),
        roomId,
        userId: session.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        equipment: JSON.stringify(equipment || []),
        purpose,
        status: room.autoApprove ? 'APPROVED' : 'PENDING',
        createdAt: sql`strftime('%s', 'now')`,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .returning();

    if (recurring) {
      await db.insert(recurringBookings).values({
        id: crypto.randomUUID(),
        bookingId: newBooking.id,
        pattern: recurring.pattern,
        startDate: new Date(recurring.startDate),
        endDate: new Date(recurring.endDate),
        createdAt: sql`strftime('%s', 'now')`,
        updatedAt: sql`strftime('%s', 'now')`,
      });
    }

    const bookingResponse: Booking = {
      id: newBooking.id,
      userId: newBooking.userId,
      userName: session.user.name,
      roomId: newBooking.roomId,
      roomName: room.name,
      startTime: Number(newBooking.startTime),
      endTime: Number(newBooking.endTime),
      status: newBooking.status,
      equipment: JSON.parse(newBooking.equipment || '[]'),
      purpose: newBooking.purpose ?? undefined,
      createdAt: Number(newBooking.createdAt),
      updatedAt: Number(newBooking.updatedAt),
    };

    // Notify the user who made the booking
    await sendNotification({
      userId: session.user.id,
      message: `Booking for room "${room.name}" has been ${room.autoApprove ? 'created' : 'requested'}.`,
      type: room.autoApprove ? 'BOOKING_APPROVED' : 'BOOKING_REQUEST',
    });

    // If the user is STAFF and the booking is pending, notify admins
    if (session.user.role === 'STAFF' && newBooking.status === 'PENDING') {
        const adminUsers = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(inArray(usersTable.role, ['ADMIN', 'SUPER_ADMIN']));

        const notificationMessage = `Staff member "${session.user.name}" has requested a booking for room "${room.name}" from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}.`;

        for (const admin of adminUsers) {
            await sendNotification({
                userId: admin.id,
                message: notificationMessage,
                type: 'NEW_BOOKING_REQUEST', // You might want to define a new notification type
            });
        }
    }


    return NextResponse.json({
      success: true,
      data: {
        message: `Booking ${room.autoApprove ? 'created' : 'requested'} successfully`,
        booking: bookingResponse,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
  }
}
