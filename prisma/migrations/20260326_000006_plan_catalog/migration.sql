CREATE TABLE IF NOT EXISTS "plans" (
    "id" SERIAL NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "license_id" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "plans_tier_key" ON "plans"("tier");
CREATE UNIQUE INDEX IF NOT EXISTS "plans_slug_key" ON "plans"("slug");
CREATE INDEX IF NOT EXISTS "plans_license_id_idx" ON "plans"("license_id");

ALTER TABLE "plans"
ADD CONSTRAINT "plans_license_id_fkey"
FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "plans" ("tier", "slug", "name", "description", "display_order", "is_active")
VALUES
  ('basic', 'basic', 'Basic', 'Entry-level plan with daily limits.', 1, true),
  ('standard', 'standard', 'Standard', 'Balanced plan with broader access.', 2, true),
  ('premium', 'premium', 'Premium', 'Full-access plan with the highest limits.', 3, true)
ON CONFLICT ("tier") DO UPDATE
SET
  "slug" = EXCLUDED."slug",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order",
  "is_active" = EXCLUDED."is_active",
  "deleted_at" = NULL;

ALTER TABLE "plan_module_limits"
ADD COLUMN IF NOT EXISTS "plan_id" INTEGER;

UPDATE "plan_module_limits" AS pml
SET "plan_id" = p."id"
FROM "plans" AS p
WHERE pml."plan_id" IS NULL
  AND p."tier" = pml."plan_tier";

ALTER TABLE "plan_module_limits"
ALTER COLUMN "plan_id" SET NOT NULL;

ALTER TABLE "plan_module_limits"
ADD CONSTRAINT "plan_module_limits_plan_id_fkey"
FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "plan_module_limits_license_id_plan_tier_idx";
CREATE INDEX IF NOT EXISTS "plan_module_limits_plan_id_license_id_idx" ON "plan_module_limits"("plan_id", "license_id");

ALTER TABLE "plan_module_limits"
DROP COLUMN IF EXISTS "plan_tier";
