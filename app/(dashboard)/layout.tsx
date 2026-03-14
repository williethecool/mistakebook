import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/app/components/layout/Sidebar';
import { MobileNav } from '@/app/components/layout/MobileNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar user={session.user} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Mobile top nav */}
        <MobileNav user={session.user} />

        <div className="flex-1 p-4 md:p-8 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
