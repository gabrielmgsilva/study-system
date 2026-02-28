'use client';

import React from 'react';
import Link from 'next/link';
import { Plane } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" /> Reset de senha
          </CardTitle>
          <CardDescription>
            Reset real entra depois (email + token). Por enquanto, volte ao login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link href={ROUTES.login}>Voltar para Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
