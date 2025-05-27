import { Calendar } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <Calendar className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">BookingNoted</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-blue-400">Privacy</a>
            <a href="#" className="hover:text-blue-400">Terms</a>
            <a href="#" className="hover:text-blue-400">Contact</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© {new Date().getFullYear()} BookingNoted. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}