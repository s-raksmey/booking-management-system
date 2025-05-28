'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookingWithRoomAndUser } from '@/types/booking';
import { Room } from '@/types/room';
import { toast } from 'sonner';

interface ApiResponse {
  success: boolean;
  data: BookingWithRoomAndUser[] | null | undefined;
  total: number;
}

export const useHistory = () => {
  const [bookings, setBookings] = useState<BookingWithRoomAndUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [date, setDate] = useState('');
  const [room, setRoom] = useState('all');
  const [user, setUser] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
  try {
    const response = await fetch('/api/room?page=1&limit=100', {
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();
    console.log('Raw room fetch response:', text);

    const json = JSON.parse(text);

    if (!json.success) {
      throw new Error('Failed to load rooms');
    }

    const roomList = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.data)
      ? json.data.data
      : null;

    if (!roomList) {
      throw new Error('Invalid room data format');
    }

    const roomData: Room[] = roomList.map((room: any) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity ?? 0,
      location: room.location ?? '',
      features: room.features ?? [],
      autoApprove: room.autoApprove ?? false,
      restrictedHours: room.restrictedHours,
      suspendedUntil: room.suspendedUntil,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    setRooms(roomData);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    toast.error('Failed to load rooms');
    setRooms([]);
  }
};

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(date && { date }),
        ...(room !== 'all' && { room }),
        ...(user && { user }),
      });

      const response = await fetch(`/api/bookings?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data: ApiResponse = await response.json();
      setBookings(Array.isArray(data.data) ? data.data : []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, date, room, user, limit]);

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [fetchBookings]);

  const handleFilter = () => {
    setPage(1);
    fetchBookings();
  };

  const totalPages = Math.ceil(total / limit);

  return {
    bookings,
    total,
    page,
    setPage,
    date,
    setDate,
    room,
    setRoom,
    user,
    setUser,
    rooms,
    loading,
    error,
    handleFilter,
    totalPages,
  };
};
