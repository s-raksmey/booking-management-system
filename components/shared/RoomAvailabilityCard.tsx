import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export default function RoomAvailabilityCard() {
  return (
    <Card className="shadow-xl border-none">
      <CardHeader>
        <CardTitle className="text-xl">Room Availability</CardTitle>
        <CardDescription>Wednesday, May 22</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Conference Room A</p>
              <p className="text-sm text-gray-500">9:00 AM - 10:30 AM</p>
            </div>
            <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Available
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">Board Room</p>
              <p className="text-sm text-gray-500">2:00 PM - 3:30 PM</p>
            </div>
            <div className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              Booked
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" className="text-blue-600">
          View all rooms
        </Button>
      </CardFooter>
    </Card>
  );
}