export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  features: string[]; // Array of features
  autoApprove: boolean;
  restrictedHours?: string; // JSON string or undefined
  suspendedUntil?: number; // UNIX timestamp or undefined
  createdAt: number; // UNIX timestamp
  updatedAt: number; // UNIX timestamp
}

export interface CreateRoomInput {
  name: string;
  capacity: number;
  location: string;
  features?: string[];
  autoApprove?: boolean;
  restrictedHours?: string;
}

export interface UpdateRoomInput {
  name?: string;
  capacity?: number;
  location?: string;
  features?: string[];
  autoApprove?: boolean;
  restrictedHours?: string;
}

export interface SuspendRoomInput {
  id: string;
  days: number;
}