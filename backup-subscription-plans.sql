-- Backup script for subscription plans data
-- Run this BEFORE applying schema changes

-- Export subscription plans data
COPY (
  SELECT 
    id,
    name,
    category,
    plan_type,
    price,
    features,
    razorpay_plan_id,
    billing_period,
    billing_cycle
  FROM subscription_plans
  ORDER BY name
) TO '/tmp/subscription_plans_backup.csv' WITH CSV HEADER;

-- Alternative: Create a backup table
CREATE TABLE subscription_plans_backup AS 
SELECT * FROM subscription_plans;

-- Insert script for restoring data after migration
-- (You'll run this after schema migration)

INSERT INTO "SubscriptionPlan" (
  id,
  name,
  category,
  "planType",
  price,
  features,
  "razorpayPlanId",
  "billingPeriod",
  "billingCycle"
) VALUES 
('0479838746', 'Resilience', 'PSYCHOLOGY', 'ONLINE', 18000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('24f715831c', 'Diamond Level', 'FITNESS', 'IN_PERSON', 50000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('3598f70e4b', 'Abundance', 'MANIFESTATION', 'ONLINE', 14000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('4e23be2e0c', 'Quantum Level', 'MANIFESTATION', 'ONLINE', 20000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('60cbf6651f', 'Growth Mindset', 'PSYCHOLOGY', 'ONLINE', 12000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('6f24408fba', 'Basic Clarity', 'PSYCHOLOGY', 'ONLINE', 6000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('7fe5d6cc1c', 'Silver Plan', 'FITNESS', 'ONLINE', 18000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('acf37fe040', 'Vision Star', 'MANIFESTATION', 'ONLINE', 7000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('d41dd8d1d4', 'Gold Plan', 'FITNESS', 'ONLINE', 30000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('d62e470357', 'Self-Paced', 'FITNESS', 'SELF_PACED', 2000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('efc30547b9', 'Platinum Level', 'FITNESS', 'IN_PERSON', 40000, '{"name": "plan_QDC"}', NULL, 'monthly', 1); 