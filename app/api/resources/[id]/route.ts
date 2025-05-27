import { NextResponse } from 'next/server';
import { db } from '@/db';
import { resources as resourcesTable, bookingResources as bookingResourcesTable, users as usersTable, bookings as bookingsTable } from '@/db/schema';
import { and, eq, gte, or, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Resource, UpdateResourceInput, ResourceType } from '@/types/resource';
import { sendNotification } from '@/lib/notifications';

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

    const [rawResource] = await db
      .select({
        id: resourcesTable.id,
        name: resourcesTable.name,
        type: resourcesTable.type,
        available: resourcesTable.available,
        createdAt: resourcesTable.createdAt,
        updatedAt: resourcesTable.updatedAt,
      })
      .from(resourcesTable)
      .where(eq(resourcesTable.id, id));

    if (!rawResource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    }

    const resource: Resource = {
      id: rawResource.id,
      name: rawResource.name,
      type: rawResource.type,
      available: rawResource.available,
      createdAt: Number(rawResource.createdAt),
      updatedAt: Number(rawResource.updatedAt),
    };

    return NextResponse.json({
      success: true,
      data: { resource },
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { name, type, available } = (await request.json()) as UpdateResourceInput;

    if (!name && !type && available === undefined) {
      return NextResponse.json({ success: false, error: 'At least one field is required' }, { status: 400 });
    }

    if (type && !['EQUIPMENT', 'SERVICE'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid resource type' }, { status: 400 });
    }

    const [existingResource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id));
    if (!existingResource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    }

    const [updatedResource] = await db
      .update(resourcesTable)
      .set({
        name: name ?? existingResource.name,
        type: type ? (type as ResourceType) : existingResource.type,
        available: available ?? existingResource.available,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .where(eq(resourcesTable.id, id))
      .returning();

    const resourceResponse: Resource = {
      id: updatedResource.id,
      name: updatedResource.name,
      type: updatedResource.type,
      available: updatedResource.available,
      createdAt: Number(updatedResource.createdAt),
      updatedAt: Number(updatedResource.updatedAt),
    };

    // Notify all admins
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(or(eq(usersTable.role, 'ADMIN'), eq(usersTable.role, 'SUPER_ADMIN')));

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        message: `Resource "${resourceResponse.name}" (${resourceResponse.type}) has been updated.`,
        type: 'ROOM_MODIFIED', // Using ROOM_MODIFIED as a generic notification type
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Resource updated successfully',
        resource: resourceResponse,
      },
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ success: false, error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [resource] = await db.select({ name: resourcesTable.name, type: resourcesTable.type }).from(resourcesTable).where(eq(resourcesTable.id, id));
    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    }

    // Check for active bookings using this resource
    const activeBookings = await db
      .select()
      .from(bookingResourcesTable)
      .innerJoin(bookingsTable, eq(bookingResourcesTable.bookingId, bookingsTable.id))
      .where(
        and(
          eq(bookingResourcesTable.resourceId, id),
          eq(bookingsTable.status, 'APPROVED'),
          gte(bookingsTable.endTime, new Date())
        )
      );

    if (activeBookings.length > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete resource with active bookings' }, { status: 400 });
    }

    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));

    // Notify all admins
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(or(eq(usersTable.role, 'ADMIN'), eq(usersTable.role, 'SUPER_ADMIN')));

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        message: `Resource "${resource.name}" (${resource.type}) has been deleted.`,
        type: 'ROOM_MODIFIED', // Using ROOM_MODIFIED as a generic notification type
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Resource deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete resource' }, { status: 500 });
  }
}