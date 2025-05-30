import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface BookingReport {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  startTime: number;
  endTime: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  equipment: string[];
  resources: string[];
  purpose?: string;
  createdAt: number;
  updatedAt: number;
}

interface ReportTableProps {
  reportData: BookingReport[];
}

export function ReportTable({ reportData }: ReportTableProps) {
  const formatDate = (timestamp: number) => {
    return dayjs(timestamp).tz('Asia/Bangkok').format('MMM D, YYYY h:mm A');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Resources</TableHead>
          <TableHead>Purpose</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reportData.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.id.slice(0, 8)}</TableCell>
            <TableCell>{booking.roomName}</TableCell>
            <TableCell>{booking.userName}</TableCell>
            <TableCell>{formatDate(booking.startTime)}</TableCell>
            <TableCell>{formatDate(booking.endTime)}</TableCell>
            <TableCell>{booking.status}</TableCell>
            <TableCell>{booking.resources.join(', ') || 'None'}</TableCell>
            <TableCell>{booking.purpose || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}