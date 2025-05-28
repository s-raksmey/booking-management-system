export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
  roomName: string;
  startTime: number; // UNIX timestamp
  endTime: number; // UNIX timestamp
  status: BookingStatus;
  equipment: string[];
  purpose?: string;
  createdAt: number; // UNIX timestamp
  updatedAt: number; // UNIX timestamp
}

export interface CreateBookingInput {
  roomId: string;
  startTime: number; // UNIX timestamp
  endTime: number; // UNIX timestamp
  equipment?: string[];
  purpose?: string;
  recurring?: {
    pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    startDate: number; // UNIX timestamp
    endDate: number; // UNIX timestamp
  };
}

export interface UpdateBookingInput {
  startTime?: number; // UNIX timestamp
  endTime?: number; // UNIX timestamp
  equipment?: string[];
  purpose?: string;
  status?: BookingStatus;
}

export interface BookingWithRoomAndUser {
  id: string;
  roomName: string;
  userName: string;
  userEmail: string;
  startTime: number;
  endTime: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  createdAt: number;
}