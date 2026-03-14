'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Camera, Settings, User } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { GraduationCap } from 'lucide-react';
import type { Session } from 'next-auth';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/subjects', icon: BookOpen, label: 'Subjects' },
  { href: '/scan', icon: Camera, label: 'Scan', accent: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/profile', icon: User, label: 'Profile' },
];

interface MobileNavProps {
  user: Session['user'];
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between
                         px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg">
            Mistake<span className="text-primary">Book</span>
          </span>
        </div>
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? 'Avatar'}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
            </span>
          </div>
        )}
      </header>

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border
                      bg-card/90 backdrop-blur-xl pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, accent }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                  active ? 'text-primary' : 'text-muted-foreground',
                  accent && !active && 'relative'
                )}
              >
                {accent ? (
                  <div className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-150',
                    active ? 'bg-primary' : 'bg-primary/90 hover:bg-primary'
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                )}
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
