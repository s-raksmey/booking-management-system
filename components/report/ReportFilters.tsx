import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Room } from '@/types/room';

interface ReportFiltersProps {
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  roomName: string;
  setRoomName: (value: string) => void;
  userId: string;
  setUserId: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  format: 'json' | 'csv' | 'pdf';
  setFormat: (value: 'json' | 'csv' | 'pdf') => void;
  isLoading: boolean;
  onGenerate: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function ReportFilters({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  roomName,
  setRoomName,
  userId,
  setUserId,
  status,
  setStatus,
  format,
  setFormat,
  isLoading,
  onGenerate,
  onExportCsv,
  onExportPdf,
}: ReportFiltersProps) {
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/room?page=1&limit=100', {
        headers: { Accept: 'application/json' },
      });
  
      const text = await response.text();
      console.log('Raw room fetch response:', text);
  
      const json = JSON.parse(text);
  
      if (!json.success) {
        throw new Error('Failed to load rooms');
      }
  
      const roomList = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.data)
        ? json.data.data
        : null;
  
      if (!roomList) {
        throw new Error('Invalid room data format');
      }
  
      const roomData: Room[] = roomList.map((room: any) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity ?? 0,
        location: room.location ?? '',
        features: room.features ?? [],
        autoApprove: room.autoApprove ?? false,
        restrictedHours: room.restrictedHours,
        suspendedUntil: room.suspendedUntil,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      }));
  
      setRooms(roomData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="roomName">Room Name</Label>
          <Select value={roomName} onValueChange={setRoomName}>
            <SelectTrigger id="roomName">
              <SelectValue placeholder="Select room name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {rooms.map(room => (
                <SelectItem key={room.id} value={room.name}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
          />
        </div>
        <div>
          <Label htmlFor="format">Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger id="format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF (LaTeX)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <Button onClick={onGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generate Report
        </Button>
        {format === 'csv' && (
          <Button variant="secondary" onClick={onExportCsv} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
        {format === 'pdf' && (
          <Button variant="secondary" onClick={onExportPdf} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>
    </div>
  );
}