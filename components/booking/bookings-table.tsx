// components/bookings-table.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Booking } from '@/types/booking';

export function BookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings');
        const data = await response.json();
        if (response.ok) {
          setBookings(data);
        } else {
          throw new Error(data.error || 'Failed to fetch bookings');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch bookings');
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking =>
    booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.roomName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateBookingStatus = async (bookingId: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setBookings(bookings.map(booking =>
          booking.id === bookingId ? { ...booking, status } : booking
        ));
        toast.success(`Booking ${status.toLowerCase()}`);
      } else {
        throw new Error('Failed to update booking status');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update booking status');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(bookings.filter(booking => booking.id !== bookingId));
        toast.success('Booking deleted successfully');
      } else {
        throw new Error('Failed to delete booking');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete booking');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>{booking.userName}</TableCell>
              <TableCell>{booking.roomName}</TableCell>
              <TableCell>{new Date(booking.startTime).toLocaleDateString()}</TableCell>
              <TableCell>
                {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  booking.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.status}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {booking.status !== 'APPROVED' && (
                      <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking.id, 'APPROVED')}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {booking.status !== 'REJECTED' && (
                      <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking.id, 'REJECTED')}>
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}