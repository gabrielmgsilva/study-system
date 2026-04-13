-- Add user ownership to logbooks
-- Nullable so existing logbooks without an owner are preserved during migration.
-- New logbooks created via the API will always have a userId set.

ALTER TABLE "logbooks" ADD COLUMN "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX "logbooks_user_id_idx" ON "logbooks"("user_id");
