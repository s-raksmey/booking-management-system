'use client';

import React from 'react';
import { BookingFilters } from './BookingFilter';
import BookingHistoryTable from './BookingHistoryTable';
import { useHistory } from '@/hooks/useHistory';

const BookingHistory: React.FC = () => {
  const {
    bookings,
    total,
    page,
    setPage,
    date,
    setDate,
    room,
    setRoom,
    user,
    setUser,
    rooms,
    loading,
    error,
    handleFilter,
    totalPages,
  } = useHistory();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-blue-950 p-6">
      <div className="container mx-auto max-w-6xl py-8 px-6 transition-all duration-200">
        <BookingFilters
          date={date}
          setDate={setDate}
          room={room}
          setRoom={setRoom}
          user={user}
          setUser={setUser}
          handleFilter={handleFilter}
          rooms={rooms}
        />
        <BookingHistoryTable
          bookings={bookings}
          total={total}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default BookingHistory;