'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Edit, Trash, Clock } from 'lucide-react';
import { Booking } from '@/types/booking';
import { Room } from '@/types/room';
import dayjs from 'dayjs'; // Replace date-fns import
import { motion } from 'framer-motion';

interface BookingTableProps {
  bookings: Booking[];
  rooms: Room[];
  loading: boolean;
  error: string | null;
  onApproveReject: (booking: Booking, status: 'APPROVED' | 'REJECTED') => void;
  onCancel: (id: string) => void;
  onModify: (booking: Booking) => void;
  onSuspend: (room: Room) => void;
}

export function BookingTable({
  bookings,
  rooms,
  loading,
  error,
  onApproveReject,
  onCancel,
  onModify,
  onSuspend,
}: BookingTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Attendees</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(booking => (
            <TableRow key={booking.id}>
              <TableCell>{booking.roomName}</TableCell>
              <TableCell>{booking.userName}</TableCell>
              {/* Updated formatting using Day.js */}
              <TableCell>{dayjs(booking.startTime).format('YYYY-MM-DD HH:mm')}</TableCell>
              <TableCell>{dayjs(booking.endTime).format('YYYY-MM-DD HH:mm')}</TableCell>
              <TableCell>{booking.purpose || 'N/A'}</TableCell>
              <TableCell>
                {booking.equipment.length > 0 ? booking.equipment.length : 'N/A'}
              </TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {booking.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onApproveReject(booking, 'APPROVED')}
                        className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                        aria-label={`Approve booking for ${booking.roomName}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onApproveReject(booking, 'REJECTED')}
                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                        aria-label={`Reject booking for ${booking.roomName}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onModify(booking)}
                    className="border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                    aria-label={`Modify booking for ${booking.roomName}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onCancel(booking.id)}
                    className="border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                    aria-label={`Cancel booking for ${booking.roomName}`}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onSuspend(rooms.find(r => r.id === booking.roomId)!)}
                    className="border-yellow-200 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                    aria-label={`Suspend bookings for ${booking.roomName}`}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}