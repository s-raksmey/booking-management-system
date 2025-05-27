// hooks/use-session-status.ts
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export function useSessionStatus() {
  const { data: session, status } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const authenticated = status === 'authenticated';
    const role = session?.user?.role as UserRole;
    
    setIsLoggedIn(authenticated && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role));
    setUserRole(role || null);
    setIsAdmin(authenticated && ['SUPER_ADMIN', 'ADMIN'].includes(role));
    setIsStaff(authenticated && role === 'STAFF');
  }, [status, session]);

  return { 
    isLoggedIn, 
    session, 
    status, 
    userRole,
    isAdmin,
    isStaff,
    isSuperAdmin: userRole === 'SUPER_ADMIN'
  };
}