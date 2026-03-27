BEGIN;

CREATE TYPE "QuestionType" AS ENUM ('single_choice');
CREATE TYPE "QuestionStatus" AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE "ContentLocale" AS ENUM ('en', 'pt');

ALTER TABLE "audit_events" DROP CONSTRAINT "audit_events_logbook_id_fkey";
ALTER TABLE "credit_accounts" DROP CONSTRAINT "credit_accounts_user_id_fkey";
ALTER TABLE "credit_ledger" DROP CONSTRAINT "credit_ledger_user_id_fkey";
ALTER TABLE "entitlements" DROP CONSTRAINT "entitlements_user_id_fkey";
ALTER TABLE "license_entitlements" DROP CONSTRAINT "license_entitlements_user_id_fkey";
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";
ALTER TABLE "practice_states" DROP CONSTRAINT "practice_states_user_id_fkey";
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";
ALTER TABLE "signatories" DROP CONSTRAINT "signatories_logbook_id_fkey";
ALTER TABLE "signatory_verification_requests" DROP CONSTRAINT "signatory_verification_requests_signatory_id_fkey";
ALTER TABLE "study_progress" DROP CONSTRAINT "study_progress_user_id_fkey";
ALTER TABLE "study_sessions" DROP CONSTRAINT "study_sessions_user_id_fkey";
ALTER TABLE "task_signature_requests" DROP CONSTRAINT "task_signature_requests_logbook_id_fkey";
ALTER TABLE "task_signature_requests" DROP CONSTRAINT "task_signature_requests_signatory_id_fkey";
ALTER TABLE "test_attempts" DROP CONSTRAINT "test_attempts_user_id_fkey";
ALTER TABLE "user_streaks" DROP CONSTRAINT "user_streaks_user_id_fkey";

CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "license_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_title" TEXT,
    "subtitle" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "external_id" TEXT NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "question_type" "QuestionType" NOT NULL DEFAULT 'single_choice',
    "stem" TEXT NOT NULL,
    "difficulty" INTEGER,
    "status" "QuestionStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_file" TEXT,
    "created_by_id" INTEGER,
    "reviewed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_explanations" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "correct_explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_explanations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_option_explanations" (
    "id" SERIAL NOT NULL,
    "question_option_id" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_option_explanations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_references" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "document" TEXT,
    "area" TEXT,
    "topic_ref" TEXT,
    "locator" TEXT,
    "note" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_references_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_module_limits" (
    "id" SERIAL NOT NULL,
    "plan_tier" "PlanTier" NOT NULL,
    "license_id" TEXT NOT NULL,
    "module_id" INTEGER,
    "flashcards_per_day" INTEGER,
    "practice_per_day" INTEGER,
    "tests_per_week" INTEGER,
    "max_questions_per_session" INTEGER,
    "logbook_access" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plan_module_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "modules_module_key_key" ON "modules"("module_key");
CREATE INDEX "modules_license_id_idx" ON "modules"("license_id");
CREATE UNIQUE INDEX "modules_license_id_slug_key" ON "modules"("license_id", "slug");
CREATE INDEX "subjects_module_id_idx" ON "subjects"("module_id");
CREATE UNIQUE INDEX "subjects_module_id_code_key" ON "subjects"("module_id", "code");
CREATE INDEX "topics_subject_id_idx" ON "topics"("subject_id");
CREATE UNIQUE INDEX "topics_subject_id_code_key" ON "topics"("subject_id", "code");
CREATE INDEX "questions_topic_id_idx" ON "questions"("topic_id");
CREATE INDEX "questions_created_by_id_idx" ON "questions"("created_by_id");
CREATE INDEX "questions_reviewed_by_id_idx" ON "questions"("reviewed_by_id");
CREATE UNIQUE INDEX "questions_external_id_locale_key" ON "questions"("external_id", "locale");
CREATE INDEX "question_options_question_id_idx" ON "question_options"("question_id");
CREATE UNIQUE INDEX "question_options_question_id_option_key_key" ON "question_options"("question_id", "option_key");
CREATE UNIQUE INDEX "question_explanations_question_id_key" ON "question_explanations"("question_id");
CREATE UNIQUE INDEX "question_option_explanations_question_option_id_key" ON "question_option_explanations"("question_option_id");
CREATE INDEX "question_references_question_id_idx" ON "question_references"("question_id");
CREATE INDEX "plan_module_limits_license_id_plan_tier_idx" ON "plan_module_limits"("license_id", "plan_tier");
CREATE INDEX "plan_module_limits_module_id_idx" ON "plan_module_limits"("module_id");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "license_entitlements" ADD CONSTRAINT "license_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "practice_states" ADD CONSTRAINT "practice_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "signatories" ADD CONSTRAINT "signatories_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "signatory_verification_requests" ADD CONSTRAINT "signatory_verification_requests_signatory_id_fkey" FOREIGN KEY ("signatory_id") REFERENCES "signatories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_signature_requests" ADD CONSTRAINT "task_signature_requests_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_signature_requests" ADD CONSTRAINT "task_signature_requests_signatory_id_fkey" FOREIGN KEY ("signatory_id") REFERENCES "signatories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "modules" ADD CONSTRAINT "modules_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_explanations" ADD CONSTRAINT "question_explanations_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_option_explanations" ADD CONSTRAINT "question_option_explanations_question_option_id_fkey" FOREIGN KEY ("question_option_id") REFERENCES "question_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_references" ADD CONSTRAINT "question_references_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_module_limits" ADD CONSTRAINT "plan_module_limits_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_module_limits" ADD CONSTRAINT "plan_module_limits_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;