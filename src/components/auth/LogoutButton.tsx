'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);

    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    setLoading(false);

    // ✅ Go to landing page after logout
    router.push(ROUTES.landing);
    router.refresh();
  }

  return (
    <Button
      onClick={onLogout}
      variant="ghost"
      size="sm"
      disabled={loading}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4 mr-1" />
      {loading ? 'Signing out...' : 'Logout'}
    </Button>
  );
}
