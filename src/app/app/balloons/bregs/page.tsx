import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/routes';

// Legacy route kept until the Balloons BREGS study page is implemented.
export default function BalloonsStudyRegsLegacyPage() {
  redirect(ROUTES.balloonsHub);
}
