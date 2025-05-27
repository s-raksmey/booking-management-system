// app/admin/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-option';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default async function AdminPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      redirect('/login?callbackUrl=/admin');
    }

    if (session.user.role !== 'ADMIN') {
      redirect('/unauthorized');
    }

    return <AdminDashboard />;
  } catch (error) {
    console.error('Error in StaffPage:', error);
    redirect('/error?message=Failed to load staff dashboard');
  }
}