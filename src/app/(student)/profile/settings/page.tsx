import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function SettingsPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  return (
    <div className="min-h-screen pb-24 px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      <div className="space-y-3">
        {/* Appearance */}
        <Card className="p-4">
          <h2 className="font-medium text-sm mb-2">Appearance</h2>
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-sm">Dark Mode</span>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4">
          <h2 className="font-medium text-sm mb-2">Notifications</h2>
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-sm">Study Reminders</span>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-sm">Weekly Summary</span>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
        </Card>

        {/* Sound & Haptics */}
        <Card className="p-4">
          <h2 className="font-medium text-sm mb-2">Sound & Haptics</h2>
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-sm">Sound Effects</span>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-sm">Haptic Feedback</span>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
        </Card>

        {/* Account */}
        <Card className="p-4">
          <h2 className="font-medium text-sm mb-2">Account</h2>
          <a
            href="/auth/forgot-password"
            className="flex items-center min-h-[44px] text-sm text-primary"
          >
            Change Password
          </a>
        </Card>
      </div>
    </div>
  );
}
