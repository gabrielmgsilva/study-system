import { redirect } from 'next/navigation';

import { getCurrentUserServer } from '@/lib/currentUserServer';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/auth/login');
  return <>{children}</>;
}
