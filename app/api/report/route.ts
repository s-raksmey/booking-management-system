import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings as bookingsTable, rooms as roomsTable, users as usersTable, bookingResources as bookingResourcesTable, resources as resourcesTable } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { BookingReport, BookingReportQuery, BookingStatus, ReportFormat } from '@/types/report';
import { createObjectCsvStringifier } from 'csv-writer';

// Helper to format timestamp for display
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });
};

// Helper to escape LaTeX special characters
const escapeLatex = (text: string) => {
  if (!text) return text;
  return text.replace(/([&%$#_{}])/g, '\\$1').replace(/\\/g, '\\textbackslash');
};

export async function GET(request: Request) {
  try {
    // Check session and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('No session found');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      console.error('Unauthorized role:', session.user.role);
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query: BookingReportQuery = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      roomName: searchParams.get('roomName'),
      userId: searchParams.get('userId'),
      status: searchParams.get('status') as BookingStatus,
      format: (searchParams.get('format') as ReportFormat) || 'json',
      page: parseInt(searchParams.get('page') || '1', 10) || 1,
      limit: parseInt(searchParams.get('limit') || '10', 10) || 10,
    };

    // Ensure page and limit are defined
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Validate pagination
    if (page < 1 || limit < 1) {
      console.error('Invalid pagination parameters:', { page, limit });
      return NextResponse.json({ success: false, error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // Build query conditions
    const conditions = [];
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (isNaN(start.getTime())) {
        console.error('Invalid startDate format:', query.startDate);
        return NextResponse.json({ success: false, error: 'Invalid startDate format' }, { status: 400 });
      }
      const startSeconds = Math.floor(start.getTime() / 1000);
      conditions.push(sql`${bookingsTable.startTime} >= ${startSeconds}`);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (isNaN(end.getTime())) {
        console.error('Invalid endDate format:', query.endDate);
        return NextResponse.json({ success: false, error: 'Invalid endDate format' }, { status: 400 });
      }
      const endSeconds = Math.floor(end.getTime() / 1000);
      conditions.push(sql`${bookingsTable.endTime} <= ${endSeconds}`);
    }
    if (query.roomName && query.roomName !== 'none') {
      const room = await db
        .select({ id: roomsTable.id })
        .from(roomsTable)
        .where(eq(roomsTable.name, query.roomName))
        .limit(1);
      if (room.length === 0) {
        console.error('Room not found:', query.roomName);
        return NextResponse.json({ success: false, error: 'Room not found' }, { status: 400 });
      }
      conditions.push(eq(bookingsTable.roomId, room[0].id));
    }
    if (query.userId) {
      const user = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, query.userId))
        .limit(1);
      if (user.length === 0) {
        console.error('User not found:', query.userId);
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
      }
      conditions.push(eq(bookingsTable.userId, query.userId));
    }
    if (query.status && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(query.status)) {
      conditions.push(eq(bookingsTable.status, query.status));
    }

    // Fetch bookings
    const baseQuery = db
      .select({
        id: bookingsTable.id,
        roomId: bookingsTable.roomId,
        roomName: roomsTable.name,
        userId: bookingsTable.userId,
        userName: usersTable.name,
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
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const rawBookings = await baseQuery;
    if (!rawBookings.length) {
      console.log('No bookings found for query:', { ...query, page, limit });
      return NextResponse.json({
        success: true,
        data: { data: [], total: 0, page, limit, totalPages: 0 },
      });
    }

    // Fetch resources
    const bookingIds = rawBookings.map(b => b.id);
    const bookingResources = bookingIds.length > 0
      ? await db
          .select({
            bookingId: bookingResourcesTable.bookingId,
            resourceName: resourcesTable.name,
          })
          .from(bookingResourcesTable)
          .innerJoin(resourcesTable, eq(bookingResourcesTable.resourceId, resourcesTable.id))
          .where(inArray(bookingResourcesTable.bookingId, bookingIds))
      : [];

    const bookings: BookingReport[] = rawBookings.map(booking => ({
      id: booking.id,
      roomId: booking.roomId,
      roomName: booking.roomName,
      userId: booking.userId,
      userName: booking.userName,
      startTime: Number(booking.startTime) * 1000,
      endTime: Number(booking.endTime) * 1000,
      status: booking.status,
      equipment: JSON.parse(booking.equipment || '[]'),
      resources: bookingResources
        .filter(br => br.bookingId === booking.id)
        .map(br => br.resourceName),
      purpose: booking.purpose ?? undefined,
      createdAt: Number(booking.createdAt) * 1000,
      updatedAt: Number(booking.updatedAt) * 1000,
    }));

    // Handle export formats
    if (query.format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'ID', title: 'ID' },
          { id: 'Room', title: 'Room' },
          { id: 'User', title: 'User' },
          { id: 'StartTime', title: 'Start Time' },
          { id: 'EndTime', title: 'End Time' },
          { id: 'Status', title: 'Status' },
          { id: 'Equipment', title: 'Equipment' },
          { id: 'Resources', title: 'Resources' },
          { id: 'Purpose', title: 'Purpose' },
          { id: 'CreatedAt', title: 'Created At' },
          { id: 'UpdatedAt', title: 'Updated At' },
        ],
      });

      const csvData = bookings.map(b => ({
        ID: b.id,
        Room: b.roomName,
        User: b.userName,
        StartTime: formatDate(b.startTime / 1000),
        EndTime: formatDate(b.endTime / 1000),
        Status: b.status,
        Equipment: b.equipment.join(', '),
        Resources: b.resources.join(', '),
        Purpose: b.purpose || '',
        CreatedAt: formatDate(b.createdAt / 1000),
        UpdatedAt: formatDate(b.updatedAt / 1000),
      }));

      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=booking_report.csv',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (query.format === 'pdf') {
      const latexContent = `
\\documentclass{article}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}

\\title{Booking Report}
\\date{\\today}
\\author{}

\\begin{document}
\\maketitle

\\begin{longtable}{p{2cm}p{2cm}p{2cm}p{2.5cm}p{2.5cm}p{2cm}p{2cm}p{2cm}}
\\toprule
ID & Room & User & Start & End & Status & Resources & Purpose \\\\
\\midrule
${bookings
  .map(
    b => `${escapeLatex(b.id.slice(0, 8))} & ${escapeLatex(b.roomName)} & ${escapeLatex(b.userName)} & ${escapeLatex(formatDate(b.startTime / 1000))} & ${escapeLatex(formatDate(b.endTime / 1000))} & ${escapeLatex(b.status)} & ${escapeLatex(b.resources.join(', '))} & ${escapeLatex(b.purpose || '')} \\\\`
  )
  .join('\n')}
\\bottomrule
\\end{longtable}

\\end{document}
`;

      return new NextResponse(latexContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/x-tex',
          'Content-Disposition': 'attachment; filename=booking_report.tex',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // JSON response with pagination
    const totalCountQuery = await db
      .select({ count: sql`count(*)` })
      .from(bookingsTable)
      .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
      .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(totalCountQuery[0].count);
    const paginatedBookings = bookings.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedBookings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error generating booking report:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      query: new URL(request.url).searchParams.toString(),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}