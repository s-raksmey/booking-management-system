'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Booking } from '@/types/booking';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ModifyBookingFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSubmit: (data: {
    startTime?: number;
    endTime?: number;
    purpose?: string;
    equipment?: string[];
  }) => void;
}

export function ModifyBookingForm({ isOpen, onOpenChange, booking, onSubmit }: ModifyBookingFormProps) {
  const [formData, setFormData] = useState({
    startTime: booking ? dayjs(booking.startTime).format('YYYY-MM-DDTHH:mm') : '',
    endTime: booking ? dayjs(booking.endTime).format('YYYY-MM-DDTHH:mm') : '',
    purpose: booking?.purpose || '',
    equipment: booking?.equipment.join(', ') || '',
  });

  const handleSubmit = () => {
    onSubmit({
      startTime: formData.startTime ? new Date(formData.startTime).getTime() : undefined,
      endTime: formData.endTime ? new Date(formData.endTime).getTime() : undefined,
      purpose: formData.purpose || undefined,
      equipment: formData.equipment ? formData.equipment.split(',').map(e => e.trim()).filter(e => e) : undefined,
    });
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
              Modify Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="startTime" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="purpose" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Purpose
              </Label>
              <Input
                id="purpose"
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Team Meeting"
                className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="equipment" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Equipment (comma-separated)
              </Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                placeholder="e.g., projector, whiteboard"
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
              Update Booking
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}