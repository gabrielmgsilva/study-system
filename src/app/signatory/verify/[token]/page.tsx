import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/token';
import VerifyClient from './verify-client';

export default async function Page({ params }: { params: { token: string } }) {
  const tokenHash = hashToken(params.token);

  const req = await prisma.signatoryVerificationRequest.findFirst({
    where: { tokenHash, deletedAt: null, signatory: { deletedAt: null } },
    include: { signatory: true },
  });

  if (!req) return <div className="p-6">Invalid link.</div>;
  if (req.usedAt) return <div className="p-6">This link was already used.</div>;
  if (req.expiresAt < new Date()) return <div className="p-6">This link has expired.</div>;

  return (
    <VerifyClient
      rawToken={params.token}
      signatory={{
        id: String(req.signatory.id),
        name: req.signatory.name,
        email: req.signatory.email,
        licenceOrAuthNo: req.signatory.licenceOrAuthNo ?? '',
        initials: req.signatory.initials ?? '',
        signatureSvg: req.signatory.signatureSvg ?? null,
        status: String(req.signatory.status),
      }}
    />
  );
}
