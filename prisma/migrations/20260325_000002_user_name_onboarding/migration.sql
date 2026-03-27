BEGIN;

ALTER TABLE "users"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "primary_license_id" TEXT,
  ADD COLUMN "study_level" TEXT,
  ADD COLUMN "study_goal" TEXT,
  ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);

UPDATE "users"
SET
  "name" = COALESCE(NULLIF(TRIM("username"), ''), "name"),
  "onboarding_completed_at" = COALESCE("onboarding_completed_at", "created_at")
WHERE "deleted_at" IS NULL;

COMMIT;