BEGIN;

CREATE TYPE "LimitUnit" AS ENUM ('day', 'week', 'month');

ALTER TABLE "plans"
ADD COLUMN IF NOT EXISTS "price" DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS "max_licenses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "flashcards_limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "flashcards_unit" "LimitUnit" NOT NULL DEFAULT 'day',
ADD COLUMN IF NOT EXISTS "practice_limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "practice_unit" "LimitUnit" NOT NULL DEFAULT 'day',
ADD COLUMN IF NOT EXISTS "tests_limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tests_unit" "LimitUnit" NOT NULL DEFAULT 'week',
ADD COLUMN IF NOT EXISTS "max_questions_per_session" INTEGER,
ADD COLUMN IF NOT EXISTS "logbook_access" BOOLEAN NOT NULL DEFAULT false;

UPDATE "plans"
SET
  "max_licenses" = CASE "tier"
    WHEN 'premium' THEN 0
    WHEN 'standard' THEN 3
    ELSE 1
  END,
  "flashcards_limit" = CASE "tier"
    WHEN 'basic' THEN 20
    ELSE 0
  END,
  "flashcards_unit" = 'day',
  "practice_limit" = CASE "tier"
    WHEN 'basic' THEN 2
    ELSE 0
  END,
  "practice_unit" = 'day',
  "tests_limit" = CASE "tier"
    WHEN 'premium' THEN 0
    WHEN 'standard' THEN 3
    ELSE 1
  END,
  "tests_unit" = 'week',
  "max_questions_per_session" = NULL,
  "logbook_access" = CASE WHEN "tier" = 'premium' THEN true ELSE false END;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "plan_id" INTEGER;

WITH ranked_plans AS (
  SELECT
    le."user_id",
    p."id" AS "plan_id",
    ROW_NUMBER() OVER (
      PARTITION BY le."user_id"
      ORDER BY
        CASE p."tier"
          WHEN 'premium' THEN 3
          WHEN 'standard' THEN 2
          ELSE 1
        END DESC,
        le."created_at" DESC,
        le."id" DESC
    ) AS "rn"
  FROM "license_entitlements" le
  INNER JOIN "plans" p ON p."tier" = le."plan"
  WHERE le."deleted_at" IS NULL
)
UPDATE "users" u
SET "plan_id" = rp."plan_id"
FROM ranked_plans rp
WHERE u."id" = rp."user_id"
  AND rp."rn" = 1
  AND u."plan_id" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_plan_id_fkey'
  ) THEN
    ALTER TABLE "users"
    ADD CONSTRAINT "users_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "users_plan_id_idx" ON "users"("plan_id");

ALTER TABLE "license_entitlements"
ADD COLUMN IF NOT EXISTS "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "license_entitlements"
SET
  "enrolled_at" = COALESCE("granted_at", "created_at", CURRENT_TIMESTAMP),
  "is_active" = CASE WHEN "deleted_at" IS NULL THEN true ELSE false END;

ALTER TABLE "license_entitlements"
DROP COLUMN IF EXISTS "plan",
DROP COLUMN IF EXISTS "flashcards",
DROP COLUMN IF EXISTS "practice",
DROP COLUMN IF EXISTS "test",
DROP COLUMN IF EXISTS "logbook",
DROP COLUMN IF EXISTS "flashcards_per_day_override",
DROP COLUMN IF EXISTS "practice_per_day_override",
DROP COLUMN IF EXISTS "tests_per_week_override",
DROP COLUMN IF EXISTS "granted_at";

DROP INDEX IF EXISTS "license_entitlements_user_id_idx";
CREATE INDEX IF NOT EXISTS "license_entitlements_user_id_is_active_idx" ON "license_entitlements"("user_id", "is_active");

DROP TABLE IF EXISTS "plan_module_limits";

ALTER TABLE "plans"
DROP CONSTRAINT IF EXISTS "plans_license_id_fkey";

DROP INDEX IF EXISTS "plans_license_id_idx";

ALTER TABLE "plans"
DROP COLUMN IF EXISTS "license_id",
DROP COLUMN IF EXISTS "tier";

DROP TYPE IF EXISTS "PlanTier";
DROP TYPE IF EXISTS "FlashcardsAccess";
DROP TYPE IF EXISTS "PracticeAccess";
DROP TYPE IF EXISTS "TestAccess";

COMMIT;
