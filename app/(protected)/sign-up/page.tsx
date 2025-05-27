'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, ArrowRight, Lock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

export default function LoginModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // components/login-modal.tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!email || !password) {
    toast.error('Please fill in all fields');
    return;
  }

  setIsLoading(true);
  toast.loading('Signing in...', { id: 'login' });

  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Get the user's role from the session
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    const userRole = session.user?.role;

    let redirectPath = '/dashboard'; // Default fallback
    if (userRole === 'SUPER_ADMIN') {
      redirectPath = '/super-admin';
    } else if (userRole === 'ADMIN') {
      redirectPath = '/admin';
    } else if (userRole === 'STAFF') {
      redirectPath = '/staff';
    }

    toast.success('Login successful!', { id: 'login' });
    window.location.href = redirectPath;
    
  } catch (error) {
    console.error('Login error:', error);
    toast.error(
      error instanceof Error ? error.message : 'Login failed',
      { id: 'login' }
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative z-10 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="mb-4 p-3 bg-blue-100/20 rounded-full">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 mt-1">Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center text-gray-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-5 px-4 border-gray-300 focus-visible:ring-blue-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center text-gray-700">
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-5 px-4 border-gray-300 focus-visible:ring-blue-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="link"
                    className="text-blue-600 px-0 hover:text-blue-700"
                    type="button"
                    onClick={() => toast.info('Password reset feature coming soon')}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}