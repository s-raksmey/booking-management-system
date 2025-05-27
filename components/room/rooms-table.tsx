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
import { MoreVertical, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { RoomForm } from './room-form';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface RoomResponse {
  error: string;
  success: boolean;
  data: {
    data: Room[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function RoomsTable() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { name: searchTerm }),
      });
      const response = await fetch(`/api/rooms?${params}`);
      const data: RoomResponse = await response.json();
      if (response.ok) {
        setRooms(data.data.data);
        setTotalPages(data.data.totalPages);
      } else {
        throw new Error(data.error || 'Failed to fetch rooms');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page, searchTerm]);

  const handleSaveRoom = (room: Room) => {
    setRooms(prev => {
      if (selectedRoom) {
        return prev.map(r => (r.id === room.id ? room : r));
      }
      return [...prev, room];
    });
    setSelectedRoom(undefined);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setRooms(rooms.filter(room => room.id !== roomId));
        toast.success(data.data.message);
      } else {
        throw new Error(data.error || 'Failed to delete room');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete room');
    }
  };

  const handleSuspendRoom = async (roomId: string, days: number) => {
    try {
      const response = await fetch('/api/rooms/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, days }),
      });
      const data = await response.json();
      if (response.ok) {
        setRooms(rooms.map(room => (room.id === roomId ? data.data.room : room)));
        toast.success(data.data.message);
      } else {
        throw new Error(data.error || 'Failed to suspend room');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend room');
    }
  };

  const handleUnsuspendRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspendedUntil: null }),
      });
      const data = await response.json();
      if (response.ok) {
        setRooms(rooms.map(room => (room.id === roomId ? data.data.room : room)));
        toast.success('Room unsuspended successfully');
      } else {
        throw new Error(data.error || 'Failed to unsuspend room');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unsuspend room');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search rooms by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Button onClick={() => setIsModalOpen(true)}>Add New Room</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Features</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : rooms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">No rooms found</TableCell>
            </TableRow>
          ) : (
            rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.name}</TableCell>
                <TableCell>{room.capacity}</TableCell>
                <TableCell>{room.location}</TableCell>
                <TableCell>{room.features.join(', ')}</TableCell>
                <TableCell>
                  {room.suspendedUntil && room.suspendedUntil > Date.now() / 1000 ? (
                    <span className="text-red-600">Suspended</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedRoom(room);
                        setIsModalOpen(true);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {room.suspendedUntil && room.suspendedUntil > Date.now() / 1000 ? (
                        <DropdownMenuItem onClick={() => handleUnsuspendRoom(room.id)}>
                          <Clock className="mr-2 h-4 w-4" />
                          Unsuspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleSuspendRoom(room.id, 7)}>
                          <Clock className="mr-2 h-4 w-4" />
                          Suspend (7 days)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => setPage(i + 1)}
                isActive={page === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <RoomForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoom(undefined);
        }}
        room={selectedRoom}
        onSave={handleSaveRoom}
      />
    </div>
  );
}