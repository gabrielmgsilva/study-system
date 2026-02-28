# AME ONE (dev)

## Setup

```bash
npm install
npx prisma db push
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Notes
- Auth: custom cookie `ameone_session` + middleware (Option A).
- Entitlements are the source of truth for module access.
- License plans gate *experience* (daily / weekly limits), not absolute counters.

## Manual test checklist (release)
- [ ] Register → lands on `/app/hub`
- [ ] Login / logout redirects behave (no bouncing to `/auth/login`)
- [ ] Hub tiles load, no 404
- [ ] Unlock a module → refresh → still unlocked
- [ ] Open each study page → no hydration warnings
- [ ] Plan gating:
  - Basic: flashcards limited per day, practice limited per day, test limited per week
  - Standard: flashcards/practice unlimited, tests limited per week
  - Premium: unlimited + logbook flag true

## Dev helper endpoints
> These are temporary until billing exists.
- `POST /api/entitlements/set-plan` body: `{ "licenseId": "m", "plan": "standard" }`
