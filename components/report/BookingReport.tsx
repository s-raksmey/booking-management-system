'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ReportFilters } from './ReportFilters';
import { ReportTable } from './ReportTable';
import { ReportPagination } from './ReportPagination';

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

interface ReportResponse {
  success: boolean;
  data?: {
    data: BookingReport[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

interface ReportQuery {
  startDate?: string;
  endDate?: string;
  roomName?: string;
  userId?: string;
  status?: string;
  format: 'json' | 'csv' | 'pdf';
  page: number;
  limit: number;
}

// Helper to validate query parameters
const validateQuery = (query: ReportQuery): void => {
  if (query.startDate && isNaN(new Date(query.startDate).getTime())) {
    throw new Error('Invalid start date format. Use YYYY-MM-DD.');
  }
  if (query.endDate && isNaN(new Date(query.endDate).getTime())) {
    throw new Error('Invalid end date format. Use YYYY-MM-DD.');
  }
  if (query.startDate && query.endDate && new Date(query.startDate) > new Date(query.endDate)) {
    throw new Error('Start date cannot be after end date.');
  }
  const validStatuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  if (query.status && !validStatuses.includes(query.status)) {
    throw new Error('Invalid status selected.');
  }
};

// Helper to build query string
const buildQueryString = (query: ReportQuery): string => {
  const params = new URLSearchParams();
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.roomName && query.roomName !== 'none') params.set('roomName', query.roomName);
  if (query.userId) params.set('userId', query.userId);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  params.set('format', query.format);
  params.set('page', query.page.toString());
  params.set('limit', query.limit.toString());
  return params.toString();
};

// Helper to download file
const downloadFile = (blob: Blob, format: 'csv' | 'pdf', filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  toast.success(`${format.toUpperCase()} report downloaded successfully`);
};

export function ReportGeneration() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [reportData, setReportData] = useState<BookingReport[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchReport = useCallback(async (exportFormat: 'json' | 'csv' | 'pdf' = 'json') => {
    setIsLoading(true);
    try {
      const query: ReportQuery = {
        startDate,
        endDate,
        roomName,
        userId,
        status,
        format: exportFormat,
        page,
        limit,
      };

      // Validate query parameters
      validateQuery(query);

      // Build URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const queryString = buildQueryString(query);
      const url = `${baseUrl}/api/report?${queryString}`;
      console.log('Fetching report from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send cookies for next-auth
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        switch (response.status) {
          case 401:
            throw new Error('Unauthorized: Please log in again.');
          case 403:
            throw new Error('Forbidden: You lack sufficient permissions.');
          case 404:
            throw new Error('Report API endpoint not found. Please contact support.');
          default:
            throw new Error(errorData.error || `Failed to fetch report: HTTP ${response.status}`);
        }
      }

      // Handle file downloads (CSV or PDF)
      if (exportFormat === 'csv' || exportFormat === 'pdf') {
        const blob = await response.blob();
        const filename = exportFormat === 'csv' ? 'booking_report.csv' : 'booking_report.tex';
        downloadFile(blob, exportFormat, filename);
        return;
      }

      // Handle JSON response
      const data: ReportResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch report data.');
      }

      setReportData(data.data?.data || []);
      setTotalPages(data.data?.totalPages || 1);

      if (data.data?.data.length === 0) {
        toast.info('No bookings found for the selected filters.');
      } else {
        toast.success('Report generated successfully.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error('Fetch report error:', {
        message: errorMessage,
        query: { startDate, endDate, roomName, userId, status, format, page, limit },
        timestamp: new Date().toISOString(),
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, roomName, userId, status, page, limit]);

  useEffect(() => {
    if (format === 'json') {
      fetchReport('json');
    }
  }, [fetchReport, format]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900 dark:to-sky-800">
      <CardHeader>
        <CardTitle>Generate Booking Report</CardTitle>
      </CardHeader>
      <CardContent>
        <ReportFilters
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          roomName={roomName}
          setRoomName={setRoomName}
          userId={userId}
          setUserId={setUserId}
          status={status}
          setStatus={setStatus}
          format={format}
          setFormat={setFormat}
          isLoading={isLoading}
          onGenerate={() => fetchReport('json')}
          onExportCsv={() => fetchReport('csv')}
          onExportPdf={() => fetchReport('pdf')}
        />
        {format === 'json' && reportData.length > 0 && (
          <>
            <ReportTable reportData={reportData} />
            <ReportPagination
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              isLoading={isLoading}
            />
          </>
        )}
        {format === 'json' && reportData.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">No data available for the selected filters.</p>
        )}
      </CardContent>
    </Card>
  );
}