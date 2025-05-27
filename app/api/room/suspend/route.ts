import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms as roomsTable } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Room, SuspendRoomInput } from '@/types/room';
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, days } = (await request.json()) as SuspendRoomInput;
    if (!id || !days || days <= 0) {
      return NextResponse.json({ success: false, error: 'Room ID and valid days are required' }, { status: 400 });
    }

    const [existingRoom] = await db.select().from(roomsTable).where(eq(roomsTable.id, id));
    if (!existingRoom) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const suspendUntil = sql`strftime('%s', 'now', '+' || ${days} || ' days')`;
    const [rawRoom] = await db
      .update(roomsTable)
      .set({
        suspendedUntil: suspendUntil,
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
      suspendedUntil: Number(rawRoom.suspendedUntil),
      createdAt: Number(rawRoom.createdAt),
      updatedAt: Number(rawRoom.updatedAt),
    };

    await sendNotification({
      userId: session.user.id,
      message: `Room "${updatedRoom.name}" has been suspended for ${days} days.`,
      type: 'ROOM_MODIFIED',
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Room suspended for ${days} days`,
        room: updatedRoom,
      },
    });
  } catch (error) {
    console.error('Error suspending room:', error);
    return NextResponse.json({ success: false, error: 'Failed to suspend room' }, { status: 500 });
  }
}