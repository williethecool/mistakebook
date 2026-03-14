import { auth } from '@/lib/auth';
import { eq, count } from 'drizzle-orm';
import { db, questions, scans } from '@/lib/db';
import { formatDate } from '@/utils/helpers';
import { LogoutButton } from '@/app/components/auth/LogoutButton';
import { Camera, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const user = session!.user!;

  const [[scanCount], [totalQ], [wrongQ], [explainedQ]] = await Promise.all([
    db.select({ count: count() }).from(scans).where(eq(scans.userId, userId)),
    db.select({ count: count() }).from(questions).where(eq(questions.userId, userId)),
    db.select({ count: count() }).from(questions)
      .where(eq(questions.userId, userId)),
    db.select({ count: count() }).from(questions)
      .where(eq(questions.userId, userId)),
  ]);

  const stats = [
    { label: 'Scans', value: scanCount.count, icon: Camera, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Questions', value: totalQ.count, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Wrong', value: wrongQ.count, icon: AlertCircle, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Explained', value: explainedQ.count, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0">
      <h1 className="font-display text-3xl md:text-4xl mb-8">Profile</h1>

      {/* User card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ''} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
              <span className="font-display text-2xl text-primary">
                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-display text-2xl">{user.name ?? 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 text-center">
              <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-display">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Account info */}
      <div className="card p-6 space-y-3 mb-6">
        <h3 className="font-medium text-foreground">Account</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-muted-foreground">Member since</span>
            <span>{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-destructive/30">
        <h3 className="font-medium text-foreground mb-4">Account Actions</h3>
        <LogoutButton />
      </div>
    </div>
  );
}
