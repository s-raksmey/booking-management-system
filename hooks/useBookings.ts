import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Booking } from '@/types/booking';
import { Room } from '@/types/room';

export function useBookings(page: number, limit: number = 10) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = async (retries = 2): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings?page=${page}&limit=${limit}&status=PENDING`);
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view bookings');
          toast.error('Session expired. Please log in again.');
          return;
        }
        if (response.status === 404) {
          setError('No bookings found');
          setBookings([]);
          setTotalPages(1);
          return;
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setBookings(result.data.data || []);
        setTotalPages(result.data.totalPages || 1);
        setError(null);
      } else {
        console.error('Server error:', result.error);
        setError('Unable to load bookings due to a server issue');
        toast.error('Unable to load bookings');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (retries > 0) {
        console.log(`Retrying fetchBookings (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        return fetchBookings(retries - 1);
      }
      setError('Unable to load bookings due to a network issue');
      toast.error('Unable to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/room?page=1&limit=100');
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          return;
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setRooms(result.data.data || []);
      } else {
        console.error('Room fetch error:', result.error);
        toast.error('Unable to load rooms');
      }
    } catch (err) {
      console.error('Room fetch error:', err);
      toast.error('Unable to load rooms');
    }
  };

  const approveRejectBooking = async (booking: Booking, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, { // Corrected endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Booking updated successfully');
        await fetchBookings();
      } else {
        toast.error(result.error || 'Failed to update booking');
      }
    } catch {
      toast.error('Failed to update booking');
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, { // Corrected endpoint
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message);
        await fetchBookings();
      } else {
        toast.error(result.error || 'Failed to cancel booking');
      }
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const suspendRoom = async (roomId: string, days: number) => {
    try {
      const response = await fetch('/api/room/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, days }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message);
        // Suspending a room might affect pending bookings, so refetch
        await fetchBookings();
      } else {
        toast.error(result.error || 'Failed to suspend room');
      }
    } catch {
      toast.error('Failed to suspend room');
    }
  };

  const setTimeRestrictions = async (restrictions: {
    roomId: string;
    minDuration?: number;
    allowedStartHour?: number;
    allowedEndHour?: number;
  }) => {
    try {
      const response = await fetch('/api/room/restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restrictions),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Time slot restrictions updated');
        // Restrictions might affect future bookings, no need to refetch current list
      } else {
        toast.error(result.error || 'Failed to set restrictions');
      }
    } catch {
      toast.error('Failed to set restrictions');
    }
  };

  const modifyBooking = async (
    id: string,
    data: {
      startTime?: number;
      endTime?: number;
      purpose?: string;
      equipment?: string[];
    }
  ) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, { // Corrected endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Booking modified successfully');
        await fetchBookings(); // Refetch bookings to show updated data
        return true; // Indicate success
      } else {
        toast.error(result.error || 'Failed to modify booking');
        return false; // Indicate failure
      }
    } catch {
      toast.error('Failed to modify booking');
      return false; // Indicate failure
    }
  };


  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [page]);

  return {
    bookings,
    rooms,
    loading,
    error,
    totalPages,
    fetchBookings,
    approveRejectBooking,
    cancelBooking,
    suspendRoom,
    setTimeRestrictions,
    modifyBooking, // Export the new function
  };
}
