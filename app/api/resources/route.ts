import { NextResponse } from 'next/server';
import { db } from '@/db';
import { resources as resourcesTable, users as usersTable } from '@/db/schema';
import { and, eq, like, or, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { Resource, CreateResourceInput, ResourceType } from '@/types/resource';
import { sendNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const available = searchParams.get('available');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const conditions = [];
    if (name) {
      conditions.push(like(resourcesTable.name, `%${name}%`));
    }
    if (type && ['EQUIPMENT', 'SERVICE'].includes(type)) {
      conditions.push(eq(resourcesTable.type, type as ResourceType));
    }
    if (available !== null) {
      conditions.push(eq(resourcesTable.available, available === 'true'));
    }

    const query = db
      .select({
        id: resourcesTable.id,
        name: resourcesTable.name,
        type: resourcesTable.type,
        available: resourcesTable.available,
        createdAt: resourcesTable.createdAt,
        updatedAt: resourcesTable.updatedAt,
      })
      .from(resourcesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset((page - 1) * limit);

    const rawResources = await query;
    const [totalCount] = await db
      .select({ count: sql`count(*)` })
      .from(resourcesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const resources: Resource[] = rawResources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      available: resource.available,
      createdAt: Number(resource.createdAt),
      updatedAt: Number(resource.updatedAt),
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: resources,
        total: Number(totalCount.count),
        page,
        limit,
        totalPages: Math.ceil(Number(totalCount.count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { name, type, available } = (await request.json()) as CreateResourceInput;
    if (!name || !type || !['EQUIPMENT', 'SERVICE'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid input: name and valid type are required' }, { status: 400 });
    }

    const [newResource] = await db
      .insert(resourcesTable)
      .values({
        id: crypto.randomUUID(),
        name,
        type,
        available: available ?? true,
        createdAt: sql`strftime('%s', 'now')`,
        updatedAt: sql`strftime('%s', 'now')`,
      })
      .returning();

    const resourceResponse: Resource = {
      id: newResource.id,
      name: newResource.name,
      type: newResource.type,
      available: newResource.available,
      createdAt: Number(newResource.createdAt),
      updatedAt: Number(newResource.updatedAt),
    };

    // Notify all admins
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(or(eq(usersTable.role, 'ADMIN'), eq(usersTable.role, 'SUPER_ADMIN')));

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        message: `New resource "${name}" (${type}) has been created.`,
        type: 'ROOM_MODIFIED', // Using ROOM_MODIFIED as a generic notification type
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Resource created successfully',
        resource: resourceResponse,
      },
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ success: false, error: 'Failed to create resource' }, { status: 500 });
  }
}