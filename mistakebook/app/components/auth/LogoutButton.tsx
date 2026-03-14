'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/app/components/ui';

export function LogoutButton() {
  return (
    <Button
      variant="danger"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="gap-2"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </Button>
  );
}
