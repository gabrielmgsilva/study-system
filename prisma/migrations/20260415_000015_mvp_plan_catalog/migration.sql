BEGIN;

-- Deactivate all legacy plans
UPDATE "plans"
SET "is_active" = false, "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" IN (
  'regs-trainee', 'regs-exam-ready',
  'trainee', 'license-track', 'exam-ready', 'logbook-pro'
)
  AND "deleted_at" IS NULL;

-- Insert Student plan
-- 1 license track · flash unlimited · practice unlimited · 3 tests/week · no logbook
INSERT INTO "plans" (
  "slug", "name", "description", "price",
  "max_licenses",
  "flashcards_limit", "flashcards_unit",
  "practice_limit",  "practice_unit",
  "tests_limit",     "tests_unit",
  "max_questions_per_session",
  "logbook_access",
  "trial_days",
  "display_order",
  "is_active",
  "created_at", "updated_at"
) VALUES (
  'student',
  'Student',
  'One certification track with unlimited flashcards and practice. Up to 3 tests per week.',
  19.99,
  1,        -- max_licenses
  -1, 'day',  -- flashcards unlimited
  -1, 'day',  -- practice unlimited
   3, 'week', -- 3 tests / week
  NULL,       -- no per-session question cap
  false,      -- no logbook
  0,          -- no trial on Student (trial is Pro)
  10,
  true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "name"                     = EXCLUDED."name",
  "description"              = EXCLUDED."description",
  "price"                    = EXCLUDED."price",
  "max_licenses"             = EXCLUDED."max_licenses",
  "flashcards_limit"         = EXCLUDED."flashcards_limit",
  "flashcards_unit"          = EXCLUDED."flashcards_unit",
  "practice_limit"           = EXCLUDED."practice_limit",
  "practice_unit"            = EXCLUDED."practice_unit",
  "tests_limit"              = EXCLUDED."tests_limit",
  "tests_unit"               = EXCLUDED."tests_unit",
  "max_questions_per_session"= EXCLUDED."max_questions_per_session",
  "logbook_access"           = EXCLUDED."logbook_access",
  "trial_days"               = EXCLUDED."trial_days",
  "display_order"            = EXCLUDED."display_order",
  "is_active"                = EXCLUDED."is_active",
  "deleted_at"               = NULL,
  "updated_at"               = CURRENT_TIMESTAMP;

-- Insert Pro plan
-- 2 license tracks · everything unlimited · logbook included · 7-day trial
INSERT INTO "plans" (
  "slug", "name", "description", "price",
  "max_licenses",
  "flashcards_limit", "flashcards_unit",
  "practice_limit",  "practice_unit",
  "tests_limit",     "tests_unit",
  "max_questions_per_session",
  "logbook_access",
  "trial_days",
  "display_order",
  "is_active",
  "created_at", "updated_at"
) VALUES (
  'pro',
  'Pro',
  'Up to 2 certification tracks, unlimited study in all modes, logbook included, and a 7-day free trial.',
  29.99,
  2,        -- max_licenses
  -1, 'day',  -- flashcards unlimited
  -1, 'day',  -- practice unlimited
  -1, 'week', -- tests unlimited
  NULL,       -- no per-session question cap
  true,       -- logbook included
  7,          -- 7-day free trial
  20,
  true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "name"                     = EXCLUDED."name",
  "description"              = EXCLUDED."description",
  "price"                    = EXCLUDED."price",
  "max_licenses"             = EXCLUDED."max_licenses",
  "flashcards_limit"         = EXCLUDED."flashcards_limit",
  "flashcards_unit"          = EXCLUDED."flashcards_unit",
  "practice_limit"           = EXCLUDED."practice_limit",
  "practice_unit"            = EXCLUDED."practice_unit",
  "tests_limit"              = EXCLUDED."tests_limit",
  "tests_unit"               = EXCLUDED."tests_unit",
  "max_questions_per_session"= EXCLUDED."max_questions_per_session",
  "logbook_access"           = EXCLUDED."logbook_access",
  "trial_days"               = EXCLUDED."trial_days",
  "display_order"            = EXCLUDED."display_order",
  "is_active"                = EXCLUDED."is_active",
  "deleted_at"               = NULL,
  "updated_at"               = CURRENT_TIMESTAMP;

COMMIT;
