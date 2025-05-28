'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { BookingWithRoomAndUser } from '@/types/booking';
import { ArrowUpDown } from 'lucide-react';

interface BookingHistoryTableProps {
  bookings: BookingWithRoomAndUser[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const statusVariant = (status: BookingWithRoomAndUser['status']): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'PENDING':
      return 'outline';
    case 'REJECTED':
      return 'destructive';
    case 'CANCELLED':
      return 'secondary';
    default:
      return 'outline';
  }
};

// Generate pagination range with ellipsis
const getPaginationRange = (currentPage: number, totalPages: number) => {
  const delta = 2;
  const range = [];
  const rangeWithDots: (number | string)[] = [];
  let l;

  range.push(1);
  if (totalPages <= 1) return range;

  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    range.push(i);
  }

  if (totalPages > 1) range.push(totalPages);

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

const BookingHistoryTable: React.FC<BookingHistoryTableProps> = ({
  bookings,
  total,
  page,
  setPage,
  totalPages,
  loading,
  error,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof BookingWithRoomAndUser | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const paginationRange = getPaginationRange(page, totalPages);

  const handleSort = (column: keyof BookingWithRoomAndUser) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    // Handle null or undefined values
    if (aValue == null || bValue == null) {
      return aValue == null && bValue == null ? 0 : aValue == null ? 1 : -1;
    }

    // Handle string comparisons
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Handle date comparisons using dayjs
    const aDate = dayjs(aValue);
    const bDate = dayjs(bValue);

    // Check for invalid dates
    if (!aDate.isValid() || !bDate.isValid()) {
      return !aDate.isValid() && !bDate.isValid() ? 0 : !aDate.isValid() ? 1 : -1;
    }

    return sortDirection === 'asc'
      ? aDate.valueOf() - bDate.valueOf()
      : bDate.valueOf() - aDate.valueOf();
  });

  return (
    <Card className="mt-6 bg-white/30 dark:bg-gray-800/30">
      <CardContent className="p-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-md p-4 transition-all duration-200">
            <div className="font-semibold text-red-800 dark:text-red-300">Error</div>
            <div className="text-red-700 dark:text-red-400">{error}</div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => handleSort('roomName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Room</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>User</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => handleSort('startTime')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Start Time</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => handleSort('endTime')}
                >
                  <div className="flex items-center space-x-2">
                    <span>End Time</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Booked At</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px] bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px] bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px] bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px] bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px] bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px] bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-600 dark:text-gray-400 font-medium">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                sortedBookings.map((booking) => (
                  <TableRow key={booking.id} className=" transition-all duration-200">
                    <TableCell className="font-medium text-gray-800 dark:text-gray-200">{booking.roomName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-gray-800 dark:text-gray-200">{booking.userName}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{booking.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">
                      {dayjs(booking.startTime).format('MMM D, YYYY, h:mm A')}
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">
                      {dayjs(booking.endTime).format('MMM D, YYYY, h:mm A')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(booking.status)} className="hover:scale-105 transition-all duration-200">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">
                      {dayjs(booking.createdAt).format('MMM D, YYYY, h:mm A')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && sortedBookings.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Showing {sortedBookings.length} of {total} bookings</span>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    className={`text-gray-800 dark:text-gray-200 ${page === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200'}`}
                  />
                </PaginationItem>
                {paginationRange.map((item, index) => (
                  <PaginationItem key={index}>
                    {item === '...' ? (
                      <PaginationEllipsis className="text-gray-800 dark:text-gray-200" />
                    ) : (
                      <PaginationLink
                        onClick={() => setPage(Number(item))}
                        isActive={page === Number(item)}
                        className={
                          page === Number(item)
                            ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                            : 'text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200'
                        }
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(page + 1, totalPages))}
                    className={`text-gray-800 dark:text-gray-200 ${page === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingHistoryTable;