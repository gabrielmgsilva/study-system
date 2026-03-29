-- AlterTable: Add Stripe fields to users
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "users" ADD COLUMN "subscription_status" TEXT;
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" TIMESTAMP(3);

-- CreateIndex: Unique constraint on stripe_customer_id
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- AlterTable: Add Stripe fields to plans
ALTER TABLE "plans" ADD COLUMN "stripe_product_id" TEXT;
ALTER TABLE "plans" ADD COLUMN "stripe_price_monthly" TEXT;
ALTER TABLE "plans" ADD COLUMN "stripe_price_annual" TEXT;
ALTER TABLE "plans" ADD COLUMN "trial_days" INTEGER NOT NULL DEFAULT 7;

-- CreateTable: coupons
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "stripe_id" TEXT NOT NULL,
    "percent_off" INTEGER NOT NULL,
    "annual_only" BOOLEAN NOT NULL DEFAULT true,
    "max_redemptions" INTEGER,
    "times_redeemed" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on code
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex: Unique constraint on stripe_id
CREATE UNIQUE INDEX "coupons_stripe_id_key" ON "coupons"("stripe_id");

-- CreateTable: subscription_events
CREATE TABLE "subscription_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on stripe_event_id
CREATE UNIQUE INDEX "subscription_events_stripe_event_id_key" ON "subscription_events"("stripe_event_id");

-- CreateIndex: Index on user_id
CREATE INDEX "subscription_events_user_id_idx" ON "subscription_events"("user_id");

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
