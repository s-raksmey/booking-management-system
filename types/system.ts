// types/system.ts
export interface SystemConfig {
  maxBookingLengthHours: number;
  maxAdvanceBookingDays: number;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  bookingStartHour?: number; // Optional: e.g., 8 for 8am
  bookingEndHour?: number;   // Optional: e.g., 18 for 6pm
}