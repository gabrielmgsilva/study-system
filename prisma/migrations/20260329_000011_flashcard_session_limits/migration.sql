BEGIN;

UPDATE "plans"
SET
  "flashcards_limit" = 5,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" IN ('regs-trainee', 'trainee')
  AND "flashcards_limit" = 25
  AND "deleted_at" IS NULL;

COMMIT;