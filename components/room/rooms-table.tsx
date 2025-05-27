import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Edit, Trash, Clock } from 'lucide-react';
import { Room } from '@/types/room';

interface RoomTableProps {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  onSuspend: (room: Room) => void;
}

export function RoomTable({ rooms, loading, error, page, totalPages, setPage, onEdit, onDelete, onSuspend }: RoomTableProps) {
  const isRoomAvailable = (room: Room) => {
    const now = Math.floor(Date.now() / 1000);
    return !room.suspendedUntil || room.suspendedUntil <= now;
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map(room => (
                <TableRow key={room.id}>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.location}</TableCell>
                  <TableCell>{room.features.join(', ')}</TableCell>
                  <TableCell>
                    {isRoomAvailable(room) ? (
                      <span className="text-green-500">Available</span>
                    ) : (
                      <span className="text-red-500">Suspended</span>
                    )}
                  </TableCell>
                  <TableCell>{room.autoApprove ? 'Auto' : 'Manual'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(room)}
                        aria-label={`Edit room ${room.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onDelete(room.id)}
                        aria-label={`Delete room ${room.name}`}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onSuspend(room)}
                        aria-label={`Suspend room ${room.name}`}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </>
  );
}