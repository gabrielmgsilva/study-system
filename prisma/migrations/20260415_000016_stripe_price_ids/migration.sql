BEGIN;

UPDATE "plans"
SET
  "stripe_product_id"    = 'prod_ULBnnODHP69Zdz',
  "stripe_price_monthly" = 'price_1TMVUeKPa6Xv5qIQK5cBkhUh',
  "stripe_price_annual"  = 'price_1TMVVJKPa6Xv5qIQyMAaDgnX',
  "updated_at"           = CURRENT_TIMESTAMP
WHERE "slug" = 'student' AND "deleted_at" IS NULL;

UPDATE "plans"
SET
  "stripe_product_id"    = 'prod_ULBpPcijr2z5Iu',
  "stripe_price_monthly" = 'price_1TMVW1KPa6Xv5qIQuaaBujvY',
  "stripe_price_annual"  = 'price_1TMVWeKPa6Xv5qIQ9aPtXfb0',
  "updated_at"           = CURRENT_TIMESTAMP
WHERE "slug" = 'pro' AND "deleted_at" IS NULL;

COMMIT;
