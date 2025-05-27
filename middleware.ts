// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Public routes
      if (req.nextUrl.pathname.startsWith('/login')) return true;
      
      // Role-based authorization
      if (req.nextUrl.pathname.startsWith('/super-admin')) {
        return token?.role === 'SUPER_ADMIN';
      }
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token?.role === 'ADMIN';
      }
      if (req.nextUrl.pathname.startsWith('/staff')) {
        return token?.role === 'STAFF';
      }
      
      // Default protected route
      return !!token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/unauthorized',
  }
});

export const config = { 
  matcher: [
    '/super-admin/:path*',
    '/admin/:path*',
    '/staff/:path*',
    '/dashboard',
  ] 
};