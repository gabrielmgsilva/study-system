-- CreateTable
CREATE TABLE "question_scores" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "question_external_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 3,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "times_incorrect" INTEGER NOT NULL DEFAULT 0,
    "last_answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_answers" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "question_external_id" TEXT NOT NULL,
    "selected_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "tc_section_code" TEXT,
    "tc_topic_code" TEXT,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_performance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "topic_code" TEXT NOT NULL,
    "topic_title" TEXT,
    "questions_total" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "last_studied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_scores_user_id_question_external_id_key" ON "question_scores"("user_id", "question_external_id");

-- CreateIndex
CREATE INDEX "question_scores_user_id_module_key_idx" ON "question_scores"("user_id", "module_key");

-- CreateIndex
CREATE UNIQUE INDEX "session_answers_session_id_question_external_id_key" ON "session_answers"("session_id", "question_external_id");

-- CreateIndex
CREATE INDEX "session_answers_session_id_idx" ON "session_answers"("session_id");

-- CreateIndex
CREATE INDEX "session_answers_question_external_id_idx" ON "session_answers"("question_external_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_performance_user_id_module_key_topic_code_key" ON "topic_performance"("user_id", "module_key", "topic_code");

-- CreateIndex
CREATE INDEX "topic_performance_user_id_module_key_idx" ON "topic_performance"("user_id", "module_key");

-- AddForeignKey
ALTER TABLE "question_scores" ADD CONSTRAINT "question_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_performance" ADD CONSTRAINT "topic_performance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
