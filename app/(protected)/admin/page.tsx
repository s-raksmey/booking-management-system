import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { authOptions } from '@/lib/auth-option';

export default async function AdminPage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect('/login?callbackUrl=/admin');
    }
    if (session.user.role !== 'ADMIN') {
      redirect('/dashboard?error=unauthorized');
    }
    return <AdminDashboard />;
  } catch (error) {
    console.error('Error in AdminPage:', error);
    redirect('/error?message=Failed to load admin dashboard');
  }
}