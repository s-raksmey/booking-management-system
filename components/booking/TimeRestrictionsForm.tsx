'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room } from '@/types/room';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface TimeRestrictionsFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  onSubmit: (restrictions: {
    roomId: string;
    minDuration?: number;
    allowedStartHour?: number;
    allowedEndHour?: number;
  }) => void;
}

export function TimeRestrictionsForm({ isOpen, onOpenChange, rooms, onSubmit }: TimeRestrictionsFormProps) {
  const [restrictions, setRestrictions] = useState({
    roomId: '',
    minDuration: '',
    allowedStartHour: '',
    allowedEndHour: '',
  });

  const handleSubmit = () => {
    onSubmit({
      roomId: restrictions.roomId,
      minDuration: restrictions.minDuration ? parseInt(restrictions.minDuration) : undefined,
      allowedStartHour: restrictions.allowedStartHour ? parseInt(restrictions.allowedStartHour) : undefined,
      allowedEndHour: restrictions.allowedEndHour ? parseInt(restrictions.allowedEndHour) : undefined,
    });
    setRestrictions({ roomId: '', minDuration: '', allowedStartHour: '', allowedEndHour: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Configure Time Slot Restrictions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomId" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Room
              </Label>
              <Select
                value={restrictions.roomId}
                onValueChange={value => setRestrictions({ ...restrictions, roomId: value })}
              >
                <SelectTrigger className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id} className="text-gray-900 dark:text-gray-100">
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="minDuration" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Minimum Duration (minutes)
              </Label>
              <Input
                id="minDuration"
                type="number"
                value={restrictions.minDuration}
                onChange={e => setRestrictions({ ...restrictions, minDuration: e.target.value })}
                placeholder="e.g., 30"
                className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="allowedStartHour" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Allowed Start Hour (0-23)
              </Label>
              <Input
                id="allowedStartHour"
                type="number"
                value={restrictions.allowedStartHour}
                onChange={e => setRestrictions({ ...restrictions, allowedStartHour: e.target.value })}
                placeholder="e.g., 8"
                className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="allowedEndHour" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Allowed End Hour (0-23)
              </Label>
              <Input
                id="allowedEndHour"
                type="number"
                value={restrictions.allowedEndHour}
                onChange={e => setRestrictions({ ...restrictions, allowedEndHour: e.target.value })}
                placeholder="e.g., 18"
                className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Save Restrictions
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}