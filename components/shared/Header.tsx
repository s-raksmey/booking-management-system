'use client';

import { Calendar, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginModal from '@/app/(auth)/login/page';
import { useState } from 'react';
import { useSessionStatus } from '@/hooks/session-status';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogoutConfirmationDialog } from '@/components/ui/confirm-message';

export default function Header() {
  const [showLogin, setShowLogin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isLoggedIn, userRole } = useSessionStatus(); // Changed from role to userRole
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirect: false });
      router.refresh();
    } finally {
      setIsSigningOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <nav className="container flex items-center justify-between p-6">
        <div className="flex items-center ml-20">
          <Calendar className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">BookingNoted</span>
        </div>
        <div className="flex items-center mx-4 gap-2">
          {isLoggedIn ? (
            <>
              {userRole === 'SUPER_ADMIN' && ( // Changed to userRole
                <Button
                  onClick={() => router.push('/super-admin')}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Super Admin Dashboard
                </Button>
              )}
              {userRole === 'ADMIN' && ( // Changed to userRole
                <Button
                  onClick={() => router.push('/admin')}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              )}
              {userRole === 'STAFF' && ( // Changed to userRole
                <Button
                  onClick={() => router.push('/staff')}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Staff Dashboard
                </Button>
              )}
              <Button
                onClick={() => setShowLogoutConfirm(true)}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
      <LogoutConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleSignOut}
        isLoading={isSigningOut}
      />
    </>
  );
}