'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, UsersIcon, WifiIcon, MonitorIcon, MicIcon, CoffeeIcon, XCircleIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
// Import dayjs and necessary plugins
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; // For 'Do, MMM YYYY' or similar
import customParseFormat from 'dayjs/plugin/customParseFormat'; // For parsing custom time formats
import unix from 'dayjs'; // For parsing unix timestamps

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(unix);

// Updated Placeholder data types to match API response structure
interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string; // Added location from API
  features: string[];
  autoApprove: boolean; // Added autoApprove from API
  restrictedHours?: string; // Added restrictedHours from API
  suspendedUntil?: number; // Added suspendedUntil from API (timestamp)
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  isAvailable: boolean; // Added isAvailable property
}

interface Booking {
  id: string;
  userId: string; // Added userId from API
  userName: string; // Added userName from API
  roomId: string;
  roomName: string;
  startTime: number; // Changed to timestamp (number) from API
  endTime: number; // Changed to timestamp (number) from API
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; // Changed to uppercase from API
  equipment: string[];
  purpose?: string; // Added purpose from API
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

// Generate available times in 12-hour format (AM/PM)
const generateAvailableTimes = () => {
  const times = [];
  for (let i = 9; i <= 18; i++) { // 9 AM to 6 PM
    const hour = i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    times.push(`${hour}:00 ${ampm}`);
  }
  return times;
};

const availableTimes = generateAvailableTimes();

const equipmentOptions = [
  { name: 'Projector', icon: MonitorIcon },
  { name: 'Video Conferencing', icon: MicIcon },
  { name: 'Whiteboard', icon: null },
  { name: 'Coffee Machine', icon: CoffeeIcon },
];

export default function RoomBooking() {
  const [rooms, setRooms] = useState<Room[]>([]); // State for fetched rooms
  const [bookings, setBookings] = useState<Booking[]>([]); // State for fetched bookings
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string | undefined>(undefined); // 12-hour format string
  const [endTime, setEndTime] = useState<string | undefined>(undefined); // 12-hour format string
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string>(''); // State for booking purpose
  const [timeError, setTimeError] = useState<string | null>(null); // State for time validation error
  const [bookingProgress, setBookingProgress] = useState(0);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Fetch rooms on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const response = await fetch('/api/room');
        if (!response.ok) {
          throw new Error(`Error fetching rooms: ${response.statusText}`);
        }
        const data = await response.json();
        // Assuming the API returns { success: true, data: { data: Room[], total: number, ... } }
        if (data.success) {
          // Add isAvailable property based on suspendedUntil (simple check)
          const processedRooms = data.data.data.map((room: Room) => ({
            ...room,
            isAvailable: room.suspendedUntil ? dayjs.unix(room.suspendedUntil).isBefore(dayjs()) : true,
          }));
          setRooms(processedRooms);
        } else {
          console.error('API returned success: false', data.error);
          alert(`Failed to fetch rooms: ${data.error}`);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        alert('Failed to fetch rooms.');
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch bookings on component mount and after booking submission
  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true);
      // Fetch bookings for the current user (assuming API handles user context)
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error(`Error fetching bookings: ${response.statusText}`);
      }
      const data = await response.json();
      // Assuming the API returns { success: true, data: { data: Booking[], total: number, ... } }
      if (data.success) {
        setBookings(data.data.data);
      } else {
        console.error('API returned success: false', data.error);
        alert(`Failed to fetch bookings: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to fetch bookings.');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []); // Empty dependency array means this runs once on mount

  const handleBookRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingDialogOpen(true);
    // Reset booking form state
    setSelectedDate(undefined);
    setStartTime(undefined);
    setEndTime(undefined);
    setSelectedEquipment([]);
    setPurpose(''); // Reset purpose
    setTimeError(null); // Reset time error
    setBookingProgress(0);
  };

  const handleBookingSubmit = async () => {
    if (!selectedRoom || !selectedDate || !startTime || !endTime) {
      alert('Please fill in all booking details.');
      return;
    }

    // Clear previous time error
    setTimeError(null);

    // Combine date and time strings into Date objects for API using dayjs
    const startDateTime = dayjs(selectedDate).hour(dayjs(startTime, 'h:mm A').hour()).minute(dayjs(startTime, 'h:mm A').minute()).toDate();
    const endDateTime = dayjs(selectedDate).hour(dayjs(endTime, 'h:mm A').hour()).minute(dayjs(endTime, 'h:mm A').minute()).toDate();

    if (endDateTime <= startDateTime) {
       setTimeError('End time must be after start time.'); // Set time error state
       setIsSubmittingBooking(false);
       setBookingProgress(0);
       return;
    }

    setIsSubmittingBooking(true);
    setBookingProgress(25);

    try {
      setBookingProgress(50);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          startTime: startDateTime.toISOString(), // Send as ISO string
          endTime: endDateTime.toISOString(), // Send as ISO string
          equipment: selectedEquipment,
          purpose: purpose, // Include purpose in the API call
        }),
      });

      setBookingProgress(75);

      const data = await response.json();

      if (response.ok && data.success) {
        setBookingProgress(100);
        alert('Booking successful!'); // Consider using a toast notification instead of alert
        setIsBookingDialogOpen(false);
        // Refresh bookings list
        fetchBookings();
      } else {
        console.error('API returned success: false or error status', data.error);
        alert(`Booking failed: ${data.error || 'Unknown error'}`); // Consider using a toast notification
        setBookingProgress(0); // Reset progress on failure
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking.'); // Consider using a toast notification
      setBookingProgress(0); // Reset progress on failure
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleToggleEquipment = (equipmentName: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentName)
        ? prev.filter(item => item !== equipmentName)
        : [...prev, equipmentName]
    );
  };

  // Map API statuses to badge variants
  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED': // Added REJECTED status
         return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Map API statuses to icons
  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="mr-1 h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircleIcon className="mr-1 h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <AlertCircleIcon className="mr-1 h-4 w-4 text-yellow-500" />;
      case 'REJECTED': // Added REJECTED status
         return <XCircleIcon className="mr-1 h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-10">
      {/* Available Rooms Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>
        {isLoadingRooms ? (
          <div className="text-center text-muted-foreground py-10">Loading rooms...</div>
        ) : rooms.length === 0 ? (
           <div className="text-center text-muted-foreground py-10">No rooms available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "relative",
                  room.isAvailable ? "border-l-4 border-green-500" : "border-l-4 border-red-500 opacity-70"
                )}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                    <CardDescription>Capacity: {room.capacity} <UsersIcon className="inline-block h-4 w-4 ml-1" /></CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.features.map(feature => (
                        <Badge key={feature} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                    {/* Optional: Add room image here */}
                    {/* {room.imageUrl && <img src={room.imageUrl} alt={room.name} className="rounded-md object-cover h-32 w-full mb-4" />} */}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Badge variant={room.isAvailable ? 'default' : 'destructive'}>
                      {room.isAvailable ? 'Available' : 'Occupied'}
                    </Badge>
                    <Button
                      onClick={() => handleBookRoomClick(room)}
                      disabled={!room.isAvailable}
                    >
                      Book Now
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        {/* Changed sm:max-w-[425px] to sm:max-w-lg */}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book {selectedRoom?.name}</DialogTitle>
            <DialogDescription>
              Select your desired date, time, and equipment for the booking.
            </DialogDescription>
          </DialogHeader>
          {/* Improved layout for form sections */}
          <div className="flex flex-col gap-6 py-6"> {/* Use flex-col for stacking sections */}

            {/* Date Selection */}
            <div className="flex flex-col gap-2 md:grid md:grid-cols-4 md:items-center md:gap-4"> {/* Stack on small, grid on md+ */}
              <label htmlFor="date" className="md:text-right"> {/* Adjust text alignment for md+ */}
                Date
              </label>
              <div className="md:col-span-3"> {/* Input takes 3 columns on md+ */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal", // Full width on small screens
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? dayjs(selectedDate).format("MMM D, YYYY") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 min-w-[280px]">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Selection */}
            <div className="flex flex-col gap-2 md:grid md:grid-cols-4 md:items-center md:gap-4"> {/* Stack on small, grid on md+ */}
              <label htmlFor="time" className="md:text-right"> {/* Adjust text alignment for md+ */}
                Time
              </label>
              <div className="md:col-span-3 flex gap-2 flex-col sm:flex-row"> {/* Input takes 3 columns on md+, time selectors stack on sm */}
                <Select onValueChange={setStartTime} value={startTime}>
                  <SelectTrigger className="w-full">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Start Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setEndTime} value={endTime}>
                  <SelectTrigger className="w-full">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="End Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Time Validation Error Message */}
            {timeError && (
              <div className="flex flex-col gap-2 md:grid md:grid-cols-4 md:items-center md:gap-4 text-red-500 text-sm mt-1"> {/* Align error message */}
                 <div className="md:col-span-1"></div> {/* Empty column for alignment on md+ */}
                 <div className="md:col-span-3">{timeError}</div> {/* Error message takes 3 columns on md+ */}
              </div>
            )}


            {/* Equipment Selection */}
            <div className="flex flex-col gap-2 md:grid md:grid-cols-4 md:items-start md:gap-4"> {/* Stack on small, grid on md+ */}
              <label className="md:text-right pt-2"> {/* Adjust text alignment for md+ */}
                Equipment
              </label>
              <div className="md:col-span-3 flex flex-wrap gap-2"> {/* Input takes 3 columns on md+ */}
                {equipmentOptions.map(option => {
                  const isSelected = selectedEquipment.includes(option.name);
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.name}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleEquipment(option.name)}
                    >
                      {Icon && <Icon className="mr-1 h-4 w-4" />}
                      {option.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Purpose Input */}
            <div className="flex flex-col gap-2 md:grid md:grid-cols-4 md:items-start md:gap-4"> {/* Stack on small, grid on md+ */}
              <label htmlFor="purpose" className="md:text-right pt-2"> {/* Adjust text alignment for md+ */}
                Purpose
              </label>
              <div className="md:col-span-3"> {/* Input takes 3 columns on md+ */}
                <Textarea
                  id="purpose"
                  placeholder="e.g., Team Meeting, Client Presentation"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>


            {/* Booking Progress (Optional) */}
            {bookingProgress > 0 && bookingProgress <= 100 && (
              <div className="flex flex-col gap-2 md:grid md:grid-cols-4 md:items-center md:gap-4"> {/* Align progress bar */}
                 <label className="md:text-right"> {/* Adjust text alignment for md+ */}
                   Progress
                 </label>
                 <div className="md:col-span-3"> {/* Progress bar takes 3 columns on md+ */}
                   <Progress value={bookingProgress} className="w-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-blue-500 [&::-webkit-progress-value]:to-purple-600 [&::-moz-progress-bar]:bg-gradient-to-r [&::-moz-progress-bar]:from-blue-500 [&::-moz-progress-bar]:to-purple-600" />
                 </div>
              </div>
            )}

          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleBookingSubmit} disabled={isSubmittingBooking}>
              {isSubmittingBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upcoming Bookings Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Upcoming Bookings</h2>
        {isLoadingBookings ? (
           <div className="text-center text-muted-foreground py-10">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>No upcoming bookings yet.</p>
            <p>Book a room above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <Card
                key={booking.id}
                className={cn(
                  "relative",
                  booking.status === 'APPROVED' && 'border-l-4 border-green-500',
                  booking.status === 'CANCELLED' && 'border-l-4 border-red-500',
                  booking.status === 'PENDING' && 'border-l-4 border-yellow-500',
                  booking.status === 'REJECTED' && 'border-l-4 border-red-500' // Style REJECTED same as CANCELLED
                )}
              >
                <CardHeader>
                  <CardTitle>{booking.roomName}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {/* Format date using dayjs */}
                      {dayjs.unix(booking.startTime).format("MMM D, YYYY")}
                    </div>
                    <div className="flex items-center mt-1">
                      <ClockIcon className="mr-2 h-4 w-4" />
                      {/* Format time using dayjs (12-hour) */}
                      {dayjs.unix(booking.startTime).format('h:mm A')} - {dayjs.unix(booking.endTime).format('h:mm A')}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {booking.equipment.length > 0 ? (
                      booking.equipment.map(item => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No equipment requested</Badge>
                    )}
                  </div>
                  {booking.purpose && ( // Display purpose if it exists
                    <div className="text-sm text-muted-foreground mt-2">
                      Purpose: {booking.purpose}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {getStatusIcon(booking.status)}
                    {/* Display status with first letter capitalized */}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                  </Badge>
                  {/* Add action buttons here (e.g., Cancel, Reschedule) */}
                  {/* Example: Only show actions for APPROVED or PENDING bookings */}
                  {(booking.status === 'APPROVED' || booking.status === 'PENDING') && (
                    <div className="flex gap-2">
                      {/* <Button variant="outline" size="sm">Reschedule</Button> */}
                      {/* Implement Cancel booking logic */}
                      {/* <Button variant="destructive" size="sm">Cancel</Button> */}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
