'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        username: username.trim() || undefined,
        password,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? 'Unable to create account.');
      return;
    }

    // ✅ user is logged in automatically after register
    router.push(ROUTES.appHome);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" /> AME ONE
          </CardTitle>
          <CardDescription>
            Create your account to access the platform.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Username <span className="opacity-60">(optional)</span>
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="yourname"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="flex items-center justify-between text-sm pt-2">
              <Link
                className="text-muted-foreground hover:text-foreground"
                href={ROUTES.login}
              >
                Already have an account?
              </Link>

              <Link
                className="text-muted-foreground hover:text-foreground"
                href={ROUTES.landing}
              >
                Back to landing
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
