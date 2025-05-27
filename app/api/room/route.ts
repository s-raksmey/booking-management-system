import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms as roomsTable } from '@/db/schema';
import { eq, isNull, lte, or, sql, and, gte, like } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Room, CreateRoomInput } from '@/types/room';
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

    const { searchParams } = new URL(request.url);
    const capacity = searchParams.get('capacity');
    const features = searchParams.get('features');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const whereClauses = [];
    if (!isAdmin) {
      whereClauses.push(
        or(
          isNull(roomsTable.suspendedUntil),
          lte(roomsTable.suspendedUntil, sql`strftime('%s', 'now')`)
        )
      );
    }
    if (capacity) {
      whereClauses.push(gte(roomsTable.capacity, parseInt(capacity)));
    }
    if (location) {
      whereClauses.push(like(roomsTable.location, `%${location}%`));
    }
    if (features) {
      const featureArray = features.split(',');
      featureArray.forEach(feature => {
        whereClauses.push(like(roomsTable.features, `%${feature}%`));
      });
    }

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
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
      .limit(limit)
      .offset((page - 1) * limit);

    const rawRooms = await query;
    const rooms: Room[] = rawRooms.map(room => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      location: room.location,
      features: parseFeatures(room.features), // Parse JSON string to string[]
      autoApprove: room.autoApprove,
      restrictedHours: room.restrictedHours ?? undefined,
      suspendedUntil: room.suspendedUntil ? Number(room.suspendedUntil) : undefined,
      createdAt: Number(room.createdAt),
      updatedAt: Number(room.updatedAt),
    }));

    const [totalCount] = await db
      .select({ count: sql`count(*)` })
      .from(roomsTable)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);

    return NextResponse.json({
      success: true,
      data: {
        data: rooms,
        total: Number(totalCount.count),
        page,
        limit,
        totalPages: Math.ceil(Number(totalCount.count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, capacity, location, features, autoApprove, restrictedHours } = (await request.json()) as CreateRoomInput;
    if (!name || !capacity || !location) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const [newRoom] = await db
      .insert(roomsTable)
      .values({
        id: crypto.randomUUID(),
        name,
        capacity: parseInt(String(capacity)),
        location,
        features: stringifyFeatures(features),
        autoApprove: Boolean(autoApprove),
        restrictedHours,
        createdAt: sql`strftime('%s', 'now')`,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .returning();

    const roomResponse: Room = {
      id: newRoom.id,
      name: newRoom.name,
      capacity: newRoom.capacity,
      location: newRoom.location,
      features: parseFeatures(newRoom.features),
      autoApprove: newRoom.autoApprove,
      restrictedHours: newRoom.restrictedHours ?? undefined,
      suspendedUntil: newRoom.suspendedUntil ? Number(newRoom.suspendedUntil) : undefined,
      createdAt: Number(newRoom.createdAt),
      updatedAt: Number(newRoom.updatedAt),
    };

    await sendNotification({
      userId: session.user.id,
      message: `Room "${name}" has been created.`,
      type: 'ROOM_CREATED',
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Room added successfully',
        room: roomResponse,
      },
    });
  } catch (error) {
    console.error('Error adding room:', error);
    return NextResponse.json({ success: false, error: 'Failed to add room' }, { status: 500 });
  }
}