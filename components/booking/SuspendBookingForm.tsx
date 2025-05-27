'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface SuspendRoomFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (days: number) => void;
}

export function SuspendBookingForm({ isOpen, onOpenChange, onSubmit }: SuspendRoomFormProps) {
  const [suspendDays, setSuspendDays] = useState('');

  const handleSubmit = () => {
    const days = parseInt(suspendDays);
    if (days > 0) {
      onSubmit(days);
      setSuspendDays('');
    }
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
              Suspend Room Bookings
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="suspendDays" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Suspend for (days)
            </Label>
            <Input
              id="suspendDays"
              type="number"
              value={suspendDays}
              onChange={e => setSuspendDays(e.target.value)}
              placeholder="Enter number of days"
              className="rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
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
              Suspend
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}