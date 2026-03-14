'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home,
  BookOpen,
  Camera,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';
import type { Session } from 'next-auth';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/subjects', icon: BookOpen, label: 'Subjects' },
  { href: '/scan', icon: Camera, label: 'Add Scan' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  user: Session['user'];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 hidden md:flex flex-col z-40
                      border-r border-border bg-card/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="font-display text-xl text-foreground">
          Mistake<span className="text-primary">Book</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-transform duration-150',
                  active ? 'scale-110' : 'group-hover:scale-105'
                )}
              />
              <span className="flex-1">{label}</span>
              {href === '/scan' && !active && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + theme */}
      <div className="border-t border-border px-3 py-4 space-y-1">
        <ThemeToggle />

        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            pathname === '/profile'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? 'Avatar'}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <span className="flex-1 truncate">{user?.name ?? user?.email}</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-muted-foreground hover:text-destructive hover:bg-destructive/8
                     transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
