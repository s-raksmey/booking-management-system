'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCheck } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { BookingTable } from './BookingTable';
import { ModifyBookingForm } from './ModifyBookingForm';
import { SuspendBookingForm } from './SuspendBookingForm';
import { TimeRestrictionsForm } from './TimeRestrictionsForm';
import { Booking } from '@/types/booking';
import { Room } from '@/types/room';

export function BookingsManagement() {
  const [page, setPage] = useState(1);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isRestrictionsModalOpen, setIsRestrictionsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const {
    bookings,
    rooms,
    loading,
    error,
    totalPages,
    approveRejectBooking,
    cancelBooking,
    suspendRoom,
    setTimeRestrictions,
    modifyBooking, // Import the new function
  } = useBookings(page);

  const handleModifyBooking = async (data: {
    startTime?: number;
    endTime?: number;
    purpose?: string;
    equipment?: string[];
  }) => {
    if (!currentBooking) return;
    // Use the modifyBooking function from the hook
    const success = await modifyBooking(currentBooking.id, data);
    if (success) {
      setIsModifyModalOpen(false);
      setCurrentBooking(null);
    }
    // Error handling and toast messages are now managed within the hook
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Bookings Management
          </CardTitle>
          <Button
            onClick={() => setIsRestrictionsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          >
            <CalendarCheck className="h-4 w-4 mr-2" /> Set Time Restrictions
          </Button>
        </CardHeader>
        <CardContent>
          <BookingTable
            bookings={bookings}
            rooms={rooms}
            loading={loading}
            error={error}
            onApproveReject={approveRejectBooking}
            onCancel={cancelBooking}
            onModify={booking => {
              setCurrentBooking(booking);
              setIsModifyModalOpen(true);
            }}
            onSuspend={room => {
              setCurrentRoom(room);
              setIsSuspendModalOpen(true);
            }}
          />
          <div className="flex justify-between mt-4">
            <Button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Previous
            </Button>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModifyBookingForm
        isOpen={isModifyModalOpen}
        onOpenChange={setIsModifyModalOpen}
        booking={currentBooking}
        onSubmit={handleModifyBooking}
      />

      <SuspendBookingForm
        isOpen={isSuspendModalOpen}
        onOpenChange={setIsSuspendModalOpen}
        onSubmit={days => currentRoom && suspendRoom(currentRoom.id, days)}
      />

      <TimeRestrictionsForm
        isOpen={isRestrictionsModalOpen}
        onOpenChange={setIsRestrictionsModalOpen}
        rooms={rooms}
        onSubmit={setTimeRestrictions}
      />
    </motion.div>
  );
}
