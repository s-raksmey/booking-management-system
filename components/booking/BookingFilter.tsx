'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface Room {
  id: string;
  name: string;
}

interface BookingFiltersProps {
  date: string;
  setDate: (val: string) => void;
  room: string;
  setRoom: (val: string) => void;
  user: string;
  setUser: (val: string) => void;
  handleFilter: () => void;
  rooms: Room[];
}

export function BookingFilters({
  date,
  setDate,
  room,
  setRoom,
  user,
  setUser,
  handleFilter,
  rooms,
}: BookingFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: date ? new Date(date) : undefined,
    to: undefined,
  });

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setDate(range?.from ? dayjs(range.from).format('YYYY-MM-DD') : '');
  };

  const handleRoomChange = (value: string) => {
    setRoom(value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setDate('');
    setRoom('all');
    setUser('');
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md max-w-6xl mx-auto grid grid-cols-4 gap-6 items-end relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/10 to-sky-100/10 dark:from-blue-900/20 dark:to-sky-800/20 opacity-50 pointer-events-none" />

      {/* Date Filter */}
      <div className="relative w-full">
        <label className="mb-3 block text-sm font-medium text-blue-600 dark:text-blue-400 select-none">
          Select Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'w-full h-9 py-2 px-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 text-left text-sm font-medium text-gray-800 dark:text-gray-200 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200',
                !dateRange?.from && 'text-gray-400 dark:text-gray-500'
              )}
            >
              {dateRange?.from
                ? dayjs(dateRange.from).format('MMM D, YYYY')
                : 'Choose a date'}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-full p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md"
          >
            <Calendar
              mode="single"
              selected={dateRange?.from}
              onSelect={(date) =>
                handleDateRangeSelect(date ? { from: date, to: undefined } : undefined)
              }
              initialFocus
              className="w-full rounded-lg bg-transparent"
              classNames={{
                months: 'flex flex-col space-y-4',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center text-blue-600 dark:text-blue-400 font-medium',
                nav_button: 'h-8 w-8 bg-white/80 dark:bg-gray-800/80 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900',
                table: 'w-full border-collapse',
                head_cell: 'text-blue-500 dark:text-blue-400 rounded-md w-9 font-medium text-sm',
                cell: 'text-center text-sm p-0 relative hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md',
                day: 'h-9 w-9 p-0 font-medium hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md',
                day_selected: 'bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600',
                day_today: 'border border-blue-300 dark:border-blue-600',
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Room Filter */}
      <div className="relative w-full">
        <label className="mb-3 block text-sm font-medium text-blue-600 dark:text-blue-400 select-none">
          Select Room
        </label>
        <Select value={room} onValueChange={handleRoomChange}>
          <SelectTrigger className="w-full rounded-lg border border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 text-sm font-medium text-gray-800 dark:text-gray-200 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200">
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent className="w-full rounded-lg bg-white/90 dark:bg-gray-800/90 border border-blue-200 dark:border-blue-700 backdrop-blur-sm">
            <SelectItem value="all" className="text-sm font-medium">All Rooms</SelectItem>
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-sm font-medium">
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Filter */}
      <div className="relative w-full">
        <label className="mb-3 block text-sm font-medium text-blue-600 dark:text-blue-400 select-none">
          User
        </label>
        <Input
          value={user}
          onChange={handleUserChange}
          placeholder="Enter user name or ID"
          className="w-full rounded-lg border border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 text-sm font-medium text-gray-800 dark:text-gray-200 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
        />
      </div>

      {/* Action Buttons */}
      <div className="relative w-full">
        <label className="block text-sm font-medium text-transparent select-none">
          Actions
        </label>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!date && room === 'all' && !user}
            className="flex-1 rounded-lg border border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 text-sm font-medium text-gray-800 dark:text-gray-200 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2">
              <X className=" text-blue-500 dark:text-blue-400" />
              <span>Clear</span>
            </div>
          </Button>
          <Button
            onClick={handleFilter}
            className="flex-1 rounded-lg border border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 text-sm font-medium text-gray-800 dark:text-gray-200 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2">
              <Search className=" text-blue-500 dark:text-blue-400" />
              <span>Search</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}