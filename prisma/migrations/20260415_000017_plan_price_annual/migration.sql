BEGIN;

ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "price_annual" DECIMAL(10, 2);

UPDATE "plans"
SET "price_annual" = 179.88
WHERE "slug" = 'student' AND "deleted_at" IS NULL;

UPDATE "plans"
SET "price_annual" = 275.88
WHERE "slug" = 'pro' AND "deleted_at" IS NULL;

COMMIT;
