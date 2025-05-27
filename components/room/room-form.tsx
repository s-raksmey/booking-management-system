'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Room, CreateRoomInput, UpdateRoomInput } from '@/types/room';

interface RoomFormProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room;
  onSave: (room: Room) => void;
}

export function RoomForm({ isOpen, onClose, room, onSave }: RoomFormProps) {
  const [formData, setFormData] = useState<CreateRoomInput | UpdateRoomInput>({
    name: room?.name || '',
    capacity: room?.capacity || 0,
    location: room?.location || '',
    features: room?.features || [],
    autoApprove: room?.autoApprove || false,
    restrictedHours: room?.restrictedHours || '',
  });
  const [featuresInput, setFeaturesInput] = useState(room?.features.join(', ') || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const features = featuresInput
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      const payload = { ...formData, features };

      const url = room ? `/api/rooms/${room.id}` : '/api/rooms';
      const method = room ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save room');
      }

      onSave(data.data.room);
      toast.success(room ? 'Room updated successfully' : 'Room created successfully');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="e.g., projector, whiteboard"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="restrictedHours">Restricted Hours</Label>
              <Textarea
                id="restrictedHours"
                value={formData.restrictedHours || ''}
                onChange={(e) => setFormData({ ...formData, restrictedHours: e.target.value })}
                placeholder="e.g., 9 AM - 5 PM"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="autoApprove"
                checked={formData.autoApprove}
                onCheckedChange={(checked) => setFormData({ ...formData, autoApprove: checked })}
              />
              <Label htmlFor="autoApprove">Auto Approve Bookings</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}