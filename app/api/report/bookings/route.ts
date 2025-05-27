import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings as bookingsTable, rooms as roomsTable, users as usersTable, bookingResources as bookingResourcesTable, resources as resourcesTable } from '@/db/schema';
import { and, eq, gte, lte, inArray, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { BookingReport, BookingReportQuery, BookingStatus, ReportFormat } from '@/types/report';
import { createObjectCsvStringifier } from 'csv-writer'; // Import csv-writer

// Helper to format timestamp to readable date
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

// Helper to escape LaTeX special characters
const escapeLatex = (text: string) => {
  if (!text) return text;
  return text.replace(/([&%$#_{}])/g, '\\$1').replace(/\\/g, '\\textbackslash');
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query: BookingReportQuery = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      roomId: searchParams.get('roomId'),
      userId: searchParams.get('userId'),
      status: searchParams.get('status') as BookingStatus,
      format: (searchParams.get('format') as ReportFormat) || 'json',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '100'),
    };

    const conditions = [];
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid startDate' }, { status: 400 });
      }
      conditions.push(gte(bookingsTable.startTime, sql`${Math.floor(start.getTime() / 1000)}`));
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid endDate' }, { status: 400 });
      }
      conditions.push(lte(bookingsTable.endTime, sql`${Math.floor(end.getTime() / 1000)}`));
    }
    if (query.roomId) {
      conditions.push(eq(bookingsTable.roomId, query.roomId));
    }
    if (query.userId) {
      conditions.push(eq(bookingsTable.userId, query.userId));
    }
    if (query.status && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(query.status)) {
      conditions.push(eq(bookingsTable.status, query.status));
    }

    // Base query for bookings
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

    // Fetch resources for each booking
    const rawBookings = await baseQuery;
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

    if (query.format === 'csv') {
      // Initialize csv-writer
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

      return new NextResponse(
        latexContent,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/latex',
            'Content-Disposition': 'attachment; filename=booking_report.tex',
          },
        }
      );
    }

    // JSON response with pagination
    const totalCountQuery = await db
      .select({ count: sql`count(*)` })
      .from(bookingsTable)
      .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
      .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(totalCountQuery[0].count);
    const paginatedBookings = bookings.slice((query.page! - 1) * query.limit!, query.page! * query.limit!);

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedBookings,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit!),
      },
    });
  } catch (error) {
    console.error('Error generating booking report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}