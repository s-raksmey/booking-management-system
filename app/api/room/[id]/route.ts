import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms as roomsTable } from '@/db/schema';
import { eq, isNull, lte, or, sql, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Room, UpdateRoomInput } from '@/types/room';
import { sendNotification } from '@/lib/notifications';

const parseFeatures = (features: any): string[] => {
  if (Array.isArray(features)) return features;
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const stringifyFeatures = (features: any): string => {
  const featuresArray = parseFeatures(features);
  return JSON.stringify(featuresArray);
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
    const { id } = await params;

    // Combine conditions in a single where clause
    const whereClause = isAdmin
      ? eq(roomsTable.id, id)
      : and(
          eq(roomsTable.id, id),
          or(
            isNull(roomsTable.suspendedUntil),
            lte(roomsTable.suspendedUntil, sql`strftime('%s', 'now')`)
          )
        );

    const query = db
      .select({
        id: roomsTable.id,
        name: roomsTable.name,
        capacity: roomsTable.capacity,
        location: roomsTable.location,
        features: roomsTable.features,
        autoApprove: roomsTable.autoApprove,
        restrictedHours: roomsTable.restrictedHours,
        suspendedUntil: roomsTable.suspendedUntil,
        createdAt: roomsTable.createdAt,
        updatedAt: roomsTable.updatedAt,
      })
      .from(roomsTable)
      .where(whereClause);

    const [rawRoom] = await query;
    if (!rawRoom) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const room: Room = {
      id: rawRoom.id,
      name: rawRoom.name,
      capacity: rawRoom.capacity,
      location: rawRoom.location,
      features: parseFeatures(rawRoom.features),
      autoApprove: rawRoom.autoApprove,
      restrictedHours: rawRoom.restrictedHours ?? undefined,
      suspendedUntil: rawRoom.suspendedUntil ? Number(rawRoom.suspendedUntil) : undefined,
      createdAt: Number(rawRoom.createdAt),
      updatedAt: Number(rawRoom.updatedAt),
    };

    return NextResponse.json({
      success: true,
      data: { room },
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, capacity, location, features, autoApprove, restrictedHours } = (await request.json()) as UpdateRoomInput;
    if (!name && !capacity && !location && !features && autoApprove === undefined && !restrictedHours) {
      return NextResponse.json({ success: false, error: 'At least one field is required' }, { status: 400 });
    }

    const [existingRoom] = await db.select().from(roomsTable).where(eq(roomsTable.id, id));
    if (!existingRoom) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const [rawRoom] = await db
      .update(roomsTable)
      .set({
        name: name ?? existingRoom.name,
        capacity: capacity ? parseInt(String(capacity)) : existingRoom.capacity,
        location: location ?? existingRoom.location,
        features: features ? stringifyFeatures(features) : existingRoom.features,
        autoApprove: autoApprove ?? existingRoom.autoApprove,
        restrictedHours: restrictedHours ?? existingRoom.restrictedHours,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .where(eq(roomsTable.id, id))
      .returning();

    const updatedRoom: Room = {
      id: rawRoom.id,
      name: rawRoom.name,
      capacity: rawRoom.capacity,
      location: rawRoom.location,
      features: parseFeatures(rawRoom.features),
      autoApprove: rawRoom.autoApprove,
      restrictedHours: rawRoom.restrictedHours ?? undefined,
      suspendedUntil: rawRoom.suspendedUntil ? Number(rawRoom.suspendedUntil) : undefined,
      createdAt: Number(rawRoom.createdAt),
      updatedAt: Number(rawRoom.updatedAt),
    };

    await sendNotification({
      userId: session.user.id,
      message: `Room "${updatedRoom.name}" has been updated.`,
      type: 'ROOM_UPDATED',
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Room updated successfully',
        room: updatedRoom,
      },
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ success: false, error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const [deletedRoom] = await db
      .delete(roomsTable)
      .where(eq(roomsTable.id, id))
      .returning();

    if (!deletedRoom) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    await sendNotification({
      userId: session.user.id,
      message: `Room "${deletedRoom.name}" has been deleted.`,
      type: 'ROOM_DELETED',
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Room deleted successfully',
      },
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete room' }, { status: 500 });
  }
}