ALTER TABLE "license_entitlements"
  ADD COLUMN "flashcards_per_day_override" INTEGER,
  ADD COLUMN "practice_per_day_override" INTEGER,
  ADD COLUMN "tests_per_week_override" INTEGER;