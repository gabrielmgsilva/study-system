BEGIN;

INSERT INTO "licenses" ("id", "name", "description", "display_order", "is_active", "created_at", "updated_at")
VALUES
  ('m', 'M License', 'Mechanical track for airframe and powerplant preparation.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e', 'E License', 'Avionics-focused preparation for electrical and electronic systems.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('s', 'S License', 'Structures-focused training for repairs and structural maintenance.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('balloons', 'Balloons', 'Study path dedicated to balloon maintenance and operations.', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('regs', 'REGS', 'Regulatory study path for CARs, standards, and certification rules.', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = CURRENT_TIMESTAMP,
  "deleted_at" = NULL;

INSERT INTO "modules" (
  "license_id",
  "slug",
  "module_key",
  "name",
  "description",
  "display_order",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES
  ('m', 'standard-practices', 'm.standard-practices', 'Standard Practices - M', 'Standard Practices topics for the Transport Canada M rating.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('m', 'airframe', 'm.airframe', 'Airframe - M', 'Structures, aerodynamics, systems and repairs for AME M.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('m', 'powerplant', 'm.powerplant', 'Powerplant - M', 'Topics for the Transport Canada powerplant exam within the M rating.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e', 'standard-practices', 'e.standard-practices', 'Standard Practices Avionics', 'Foundational avionics standard practices and shop knowledge.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e', 'rating-avionics', 'e.rating-avionics', 'Avionics Systems & Theory', 'Avionics systems, theory, troubleshooting and BITE.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('s', 'standard-practices', 's.standard-practices', 'Standard Practices - S', 'Standard practices specific to the Structures licence.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('s', 'rating-structures', 's.rating-structures', 'Structures Systems & Repairs', 'Structural repairs, systems and materials for the S licence.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('balloons', 'bregs', 'balloons.bregs', 'Balloon Regulations', 'Hot air balloon regulations, operations, maintenance practices and BREGS requirements.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('regs', 'core', 'regs.core', 'REGS Core', 'Combined CARs and Standards shared across licences.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('regs', 'cars', 'regs.cars', 'CARs', 'Canadian Aviation Regulations study deck.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('regs', 'standards', 'regs.standards', 'Standards', 'Transport Canada standards study deck.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("module_key") DO UPDATE
SET
  "license_id" = EXCLUDED."license_id",
  "slug" = EXCLUDED."slug",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = CURRENT_TIMESTAMP,
  "deleted_at" = NULL;

COMMIT;