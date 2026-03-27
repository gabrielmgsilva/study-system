BEGIN;

CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "PlanTier" AS ENUM ('basic', 'standard', 'premium');
CREATE TYPE "FlashcardsAccess" AS ENUM ('daily_limit', 'unlimited');
CREATE TYPE "PracticeAccess" AS ENUM ('cooldown', 'unlimited');
CREATE TYPE "TestAccess" AS ENUM ('weekly_limit', 'unlimited');
CREATE TYPE "StudyMode" AS ENUM ('flashcard', 'practice', 'test');
CREATE TYPE "TestStatus" AS ENUM ('in_progress', 'completed', 'canceled', 'expired');
CREATE TYPE "SignatoryStatus" AS ENUM ('draft', 'pending', 'verified', 'needs_reverify');

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "last_password_change_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

CREATE TABLE "credit_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "credit_accounts_user_id_key" ON "credit_accounts"("user_id");

CREATE TABLE "credit_ledger" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX "credit_ledger_user_id_idx" ON "credit_ledger"("user_id");

CREATE TABLE "entitlements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "entitlements_user_id_module_key_key" ON "entitlements"("user_id", "module_key");
CREATE INDEX "entitlements_user_id_idx" ON "entitlements"("user_id");

CREATE TABLE "license_entitlements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "license_id" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'basic',
    "flashcards" "FlashcardsAccess" NOT NULL DEFAULT 'daily_limit',
    "practice" "PracticeAccess" NOT NULL DEFAULT 'cooldown',
    "test" "TestAccess" NOT NULL DEFAULT 'weekly_limit',
    "logbook" BOOLEAN NOT NULL DEFAULT false,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "license_entitlements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "license_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "license_entitlements_user_id_license_id_key" ON "license_entitlements"("user_id", "license_id");
CREATE INDEX "license_entitlements_user_id_idx" ON "license_entitlements"("user_id");

CREATE TABLE "study_progress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "license_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "mode" "StudyMode" NOT NULL,
    "questions_total" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "questions_incorrect" INTEGER NOT NULL DEFAULT 0,
    "last_studied_at" TIMESTAMP(3),
    "total_time_spent_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "study_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "study_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "study_progress_user_id_module_key_mode_key" ON "study_progress"("user_id", "module_key", "mode");
CREATE INDEX "study_progress_user_id_idx" ON "study_progress"("user_id");
CREATE INDEX "study_progress_user_id_license_id_idx" ON "study_progress"("user_id", "license_id");

CREATE TABLE "study_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "license_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "mode" "StudyMode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "questions_answered" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "time_spent_ms" INTEGER NOT NULL DEFAULT 0,
    "details" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX "study_sessions_user_id_idx" ON "study_sessions"("user_id");
CREATE INDEX "study_sessions_user_id_module_key_idx" ON "study_sessions"("user_id", "module_key");

CREATE TABLE "user_streaks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "user_streaks_user_id_key" ON "user_streaks"("user_id");

CREATE TABLE "practice_states" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "current_index" INTEGER NOT NULL DEFAULT 0,
    "question_ids" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "practice_states_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "practice_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "practice_states_user_id_module_key_key" ON "practice_states"("user_id", "module_key");
CREATE INDEX "practice_states_user_id_idx" ON "practice_states"("user_id");

CREATE TABLE "test_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'in_progress',
    "question_ids" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "current_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "questions_correct" INTEGER,
    "questions_total" INTEGER,
    "time_spent_ms" INTEGER,
    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX "test_attempts_user_id_idx" ON "test_attempts"("user_id");
CREATE INDEX "test_attempts_user_id_module_key_status_idx" ON "test_attempts"("user_id", "module_key", "status");

CREATE TABLE "logbooks" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "logbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "signatories" (
    "id" SERIAL NOT NULL,
    "logbook_id" INTEGER NOT NULL,
    "slot_number" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "licence_or_auth_no" TEXT,
    "initials" TEXT,
    "signature_svg" TEXT,
    "signature_updated_at" TIMESTAMP(3),
    "status" "SignatoryStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "signatories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "signatories_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id")
);

CREATE UNIQUE INDEX "signatories_logbook_id_slot_number_key" ON "signatories"("logbook_id", "slot_number");
CREATE INDEX "signatories_logbook_id_idx" ON "signatories"("logbook_id");
CREATE INDEX "signatories_email_idx" ON "signatories"("email");

CREATE TABLE "signatory_verification_requests" (
    "id" SERIAL NOT NULL,
    "signatory_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "signatory_verification_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "signatory_verification_requests_signatory_id_fkey" FOREIGN KEY ("signatory_id") REFERENCES "signatories"("id")
);

CREATE UNIQUE INDEX "signatory_verification_requests_token_hash_key" ON "signatory_verification_requests"("token_hash");
CREATE INDEX "signatory_verification_requests_signatory_id_idx" ON "signatory_verification_requests"("signatory_id");

CREATE TABLE "task_signature_requests" (
    "id" SERIAL NOT NULL,
    "logbook_id" INTEGER NOT NULL,
    "signatory_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "payload_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "task_signature_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_signature_requests_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id"),
    CONSTRAINT "task_signature_requests_signatory_id_fkey" FOREIGN KEY ("signatory_id") REFERENCES "signatories"("id")
);

CREATE UNIQUE INDEX "task_signature_requests_token_hash_key" ON "task_signature_requests"("token_hash");
CREATE INDEX "task_signature_requests_logbook_id_idx" ON "task_signature_requests"("logbook_id");
CREATE INDEX "task_signature_requests_signatory_id_idx" ON "task_signature_requests"("signatory_id");

CREATE TABLE "audit_events" (
    "id" SERIAL NOT NULL,
    "logbook_id" INTEGER,
    "actor_type" TEXT,
    "actor_id" INTEGER,
    "action" TEXT NOT NULL,
    "meta_json" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_events_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id")
);

CREATE INDEX "audit_events_logbook_id_idx" ON "audit_events"("logbook_id");
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

COMMIT;
