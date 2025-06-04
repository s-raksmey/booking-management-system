import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { authOptions } from '@/lib/auth-option';

export default async function StaffPage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect('/login?callbackUrl=/staff');
    }
    if (session.user.role !== 'STAFF') {
      redirect('/dashboard?error=unauthorized');
    }
    return <StaffDashboard />;
  } catch (error) {
    console.error('Error in AdminPage:', error);
    redirect('/error?message=Failed to load admin dashboard');
  }
}