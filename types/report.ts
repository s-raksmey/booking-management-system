export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ReportFormat = 'json' | 'pdf' | 'csv';

export interface BookingReport {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  startTime: number; // UNIX timestamp (ms)
  endTime: number; // UNIX timestamp (ms)
  status: BookingStatus;
  equipment: string[];
  resources: string[]; // Resource names from bookingResources
  purpose?: string;
  createdAt: number; // UNIX timestamp (ms)
  updatedAt: number; // UNIX timestamp (ms)
}

export interface BookingReportQuery {
  startDate?: string | null;
  endDate?: string | null;
  roomId?: string | null;
  userId?: string | null;
  status?: BookingStatus;
  format?: ReportFormat;
  page?: number;
  limit?: number;
}