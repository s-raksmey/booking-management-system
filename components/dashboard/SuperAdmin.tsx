'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UsersTable } from '../user/users-table';
import { RoomsTable } from '../room/rooms-table';
import { BookingsTable } from '../booking/bookings-table';
import { SystemConfigForm } from './system-config';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Hotel, CalendarCheck, Settings, LayoutDashboard, Menu, X, Moon, Sun, ArrowLeft, Home, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogoutConfirmationDialog } from '../ui/confirm-message';

export function SuperAdmin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['dashboard']);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Update navigation history when switching sections
  useEffect(() => {
    setNavigationHistory(prev => {
      const newHistory = [...prev];
      if (newHistory[newHistory.length - 1] !== activeSection) {
        newHistory.push(activeSection);
      }
      return newHistory;
    });
  }, [activeSection]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
      setLogoutDialogOpen(false);
    }
  };

  const handleBack = () => {
    setNavigationHistory(prev => {
      if (prev.length <= 1) {
        setActiveSection('dashboard');
        return ['dashboard'];
      }
      const newHistory = prev.slice(0, -1);
      setActiveSection(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  };

  const handleBackToHome = () => {
    router.push('/');
    router.refresh();
    setMobileNavOpen(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 dark:text-gray-200">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have permission to view this page.</p>
            <Button 
              onClick={() => router.push('/')} 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'users', icon: UserCog, label: 'Users' },
    { id: 'rooms', icon: Hotel, label: 'Rooms' },
    { id: 'bookings', icon: CalendarCheck, label: 'Bookings' },
    { id: 'config', icon: Settings, label: 'Settings' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900 dark:to-sky-800 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">1,234</div>
                <p className="text-xs text-blue-500 dark:text-blue-400">+12% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900 dark:to-sky-800 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-300">Available Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">86</div>
                <p className="text-xs text-blue-500 dark:text-blue-400">+3 new this week</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900 dark:to-sky-800 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-300">Active Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">247</div>
                <p className="text-xs text-blue-500 dark:text-blue-400">+8% from last month</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'users':
        return <UsersTable />;
      case 'rooms':
        return <RoomsTable />;
      case 'bookings':
        return <BookingsTable />;
      case 'config':
        return <SystemConfigForm />;
      default:
        return <UsersTable />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="bg-white dark:bg-gray-800 shadow-md border-blue-200 dark:border-blue-700"
        >
          {mobileNavOpen ? <X className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Menu className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 p-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Button
              variant="ghost"
              className="text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900"
              onClick={handleBackToHome}
            >
              Back to Home
            </Button>
          </div>

          <nav className="flex-1">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={activeSection === item.id ? 'secondary' : 'ghost'}
                    className={`w-full justify-start text-gray-800 dark:text-gray-200 ${activeSection === item.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-blue-50 dark:hover:bg-blue-900'}`}
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileNavOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto">
            <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-3 p-2">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{session?.user?.name}</p>
                <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400">SUPER ADMIN</Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {activeSection !== 'dashboard' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleBack}
                    className="border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {navItems.find(item => item.id === activeSection)?.label}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                className="border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                onClick={() => setLogoutDialogOpen(true)}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out
              </Button>
            </div>
          </div>

          {renderContent()}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
}