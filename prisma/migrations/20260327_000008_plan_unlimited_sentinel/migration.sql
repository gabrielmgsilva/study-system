BEGIN;

UPDATE "plans"
SET "max_licenses" = -1
WHERE "max_licenses" = 0;

UPDATE "plans"
SET "flashcards_limit" = -1
WHERE "flashcards_limit" = 0;

UPDATE "plans"
SET "practice_limit" = -1
WHERE "practice_limit" = 0;

UPDATE "plans"
SET "tests_limit" = -1
WHERE "tests_limit" = 0;

COMMIT;