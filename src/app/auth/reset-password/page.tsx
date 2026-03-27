'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const token = useMemo(() => params.get('token') || '', [params]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setError('Missing reset token. Please request a new reset link.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data?.message ?? 'Unable to reset password.');
      return;
    }

    setDone(true);
    setTimeout(() => router.push(ROUTES.login), 700);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" /> AME ONE
          </CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
              Password updated. Redirecting to login...
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">New password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Confirm password</label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button className="w-full" disabled={loading} aria-label={loading ? 'Updating password' : 'Reset password'}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Reset password
                  </>
                )}
              </Button>
            </form>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href={ROUTES.login} className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
