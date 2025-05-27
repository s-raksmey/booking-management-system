'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Room } from '@/types/room';
import { useRooms } from '@/hooks/useRoom';
import { RoomTable } from './RoomsTable';
import { RoomForm } from './RoomForm';
import { SuspendRoomDialog } from './SuspendRoomDialog';

export function RoomsManagement() {
  const { rooms, loading, error, page, totalPages, setPage, addRoom, updateRoom, deleteRoom, suspendRoom } = useRooms();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    features: '',
    autoApprove: 'false',
  });
  const [suspendDays, setSuspendDays] = useState('');

  const handleAddRoom = () => {
    addRoom({
      name: formData.name,
      capacity: parseInt(formData.capacity) || 0,
      location: formData.location,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      autoApprove: formData.autoApprove === 'true',
    });
    setIsAddModalOpen(false);
    setFormData({ name: '', capacity: '', location: '', features: '', autoApprove: 'false' });
  };

  const handleUpdateRoom = () => {
    if (!currentRoom) return;
    updateRoom(currentRoom.id, {
      name: formData.name,
      capacity: parseInt(formData.capacity) || 0,
      location: formData.location,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      autoApprove: formData.autoApprove === 'true',
    });
    setIsEditModalOpen(false);
    setFormData({ name: '', capacity: '', location: '', features: '', autoApprove: 'false' });
    setCurrentRoom(null);
  };

  const handleSuspendRoom = () => {
    if (!currentRoom) return;
    suspendRoom(currentRoom.id, parseInt(suspendDays));
    setIsSuspendModalOpen(false);
    setSuspendDays('');
    setCurrentRoom(null);
  };

  const openEditModal = (room: Room) => {
    setCurrentRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      location: room.location,
      features: room.features.join(', '),
      autoApprove: room.autoApprove.toString(),
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rooms Management</CardTitle>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Room
          </Button>
        </CardHeader>
        <CardContent>
          <RoomTable
            rooms={rooms}
            loading={loading}
            error={error}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            onEdit={openEditModal}
            onDelete={deleteRoom}
            onSuspend={(room: Room) => {
              setCurrentRoom(room);
              setIsSuspendModalOpen(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Add Room Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <RoomForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <RoomForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRoom}>Update Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Room Modal */}
      <SuspendRoomDialog
        isOpen={isSuspendModalOpen}
        onOpenChange={setIsSuspendModalOpen}
        suspendDays={suspendDays}
        setSuspendDays={setSuspendDays}
        onSuspend={handleSuspendRoom}
      />
    </div>
  );
}