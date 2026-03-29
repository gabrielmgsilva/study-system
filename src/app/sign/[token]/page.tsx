import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/token';
import SignClient from './sign-client';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  const req = await prisma.taskSignatureRequest.findFirst({
    where: { tokenHash, deletedAt: null, signatory: { deletedAt: null }, logbook: { deletedAt: null } },
    include: { signatory: true, logbook: true },
  });

  if (!req) return <div className="p-6">Invalid link.</div>;
  if (req.usedAt) return <div className="p-6">This link was already used.</div>;
  if (req.expiresAt < new Date()) return <div className="p-6">This link has expired.</div>;

  const payload = JSON.parse(req.payloadJson);

  return (
    <SignClient
      rawToken={token}
      signatory={{
        id: String(req.signatory.id),
        name: req.signatory.name,
        initials: req.signatory.initials ?? '',
        signatureSvg: req.signatory.signatureSvg ?? null,
      }}
      tasks={payload.tasks ?? []}
    />
  );
}
