import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Room } from '@/types/room';

interface UseRooms {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  fetchRooms: () => Promise<void>;
  addRoom: (data: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'suspendedUntil'>) => Promise<void>;
  updateRoom: (id: string, data: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'suspendedUntil'>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  suspendRoom: (id: string, days: number) => Promise<void>;
}

export function useRooms(initialPage: number = 1): UseRooms {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/room?page=${page}&limit=10`);
      const result = await response.json();
      if (result.success) {
        setRooms(result.data.data);
        setTotalPages(result.data.totalPages);
        setError(null);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch {
      setError('Failed to fetch rooms');
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async (data: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'suspendedUntil'>) => {
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          capacity: parseInt(String(data.capacity)),
          features: data.features.filter(f => f),
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message);
        await fetchRooms();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to add room');
    }
  };

  const updateRoom = async (id: string, data: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'suspendedUntil'>) => {
    try {
      const response = await fetch(`/api/room/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          capacity: parseInt(String(data.capacity)),
          features: data.features.filter(f => f),
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message);
        await fetchRooms();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to update room');
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      const response = await fetch(`/api/room/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message);
        await fetchRooms();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to delete room');
    }
  };

  const suspendRoom = async (id: string, days: number) => {
    try {
      const response = await fetch('/api/room/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, days }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.data.message);
        await fetchRooms();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to suspend room');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page]);

  return { rooms, loading, error, totalPages, page, setPage, fetchRooms, addRoom, updateRoom, deleteRoom, suspendRoom };
}