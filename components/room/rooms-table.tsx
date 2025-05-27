// components/rooms-table.tsx
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
import { Room } from '@/types/room';

export function RoomsTable() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        const data = await response.json();
        if (response.ok) {
          setRooms(data);
        } else {
          throw new Error(data.error || 'Failed to fetch rooms');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch rooms');
      }
    };

    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveRoom = async (roomId: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isApproved: approve }),
      });

      if (response.ok) {
        setRooms(rooms.map(room =>
          room.id === roomId ? { ...room, isApproved: approve } : room
        ));
        toast.success(`Room ${approve ? 'approved' : 'rejected'}`);
      } else {
        throw new Error('Failed to update room status');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update room status');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRooms(rooms.filter(room => room.id !== roomId));
        toast.success('Room deleted successfully');
      } else {
        throw new Error('Failed to delete room');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete room');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button>Add New Room</Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell>{room.name}</TableCell>
              <TableCell>{room.capacity}</TableCell>
              <TableCell className="truncate max-w-xs">{room.description}</TableCell>
              <TableCell>
                {room.isApproved ? (
                  <span className="text-green-600">Approved</span>
                ) : (
                  <span className="text-yellow-600">Pending</span>
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
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {room.isApproved ? (
                      <DropdownMenuItem onClick={() => handleApproveRoom(room.id, false)}>
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleApproveRoom(room.id, true)}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}