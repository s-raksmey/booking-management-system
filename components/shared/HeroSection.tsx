import { Button } from '@/components/ui/button';
import RoomAvailabilityCard from './RoomAvailabilityCard';

export default function HeroSection() {
  return (
    <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 mb-12 md:mb-0">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Smart Meeting Room <span className="text-blue-600">Management</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Streamline your office meetings with our intuitive booking system. Reserve rooms, manage resources, and get real-time availability all in one place.
        </p>
        <div className="flex space-x-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
            Get Started
          </Button>
          <Button variant="outline" className="px-8 py-4">
            Learn More
          </Button>
        </div>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-6 -left-6 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="relative">
            <RoomAvailabilityCard />
          </div>
        </div>
      </div>
    </section>
  );
}