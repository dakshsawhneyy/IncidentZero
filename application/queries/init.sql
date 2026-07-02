-- Run this against your Azure PostgreSQL database once to create the schema.
-- psql "host=<host>.postgres.database.azure.com port=5432 dbname=<db> user=<user> sslmode=require" -f init.sql

CREATE TABLE IF NOT EXISTS incidents (
  id               SERIAL PRIMARY KEY,
  title            TEXT        NOT NULL,
  severity         TEXT        NOT NULL,              -- e.g. P1
  severity_label   TEXT        NOT NULL DEFAULT '',   -- e.g. Critical
  status           TEXT        NOT NULL,              -- FIRING | RESOLVED
  service          TEXT        NOT NULL,
  team             TEXT        NOT NULL,
  start_time       TEXT        NOT NULL,              -- e.g. 07:13 AM
  date             TEXT        NOT NULL,              -- e.g. Thu, Jul 02, 2026
  slo              TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  affected_services TEXT[]     NOT NULL DEFAULT '{}',
  customer_impact  TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed incident #001 so the app works immediately after schema creation
INSERT INTO incidents (
  title, severity, severity_label, status, service, team,
  start_time, date, slo, description, affected_services, customer_impact
) VALUES (
  'Checkout API Latency Spike',
  'P1',
  'Critical',
  'FIRING',
  'checkout-api',
  'Platform Engineering',
  '07:13 AM',
  'Thu, Jul 02, 2026',
  'Checkout latency SLO breached (P99 > 500ms)',
  'Checkout API response time has spiked from a baseline of 80ms to 1.2s. Customers are experiencing failures during order placement. Error rate on /api/checkout endpoint is up from 0.2% to 18%. On-call engineer has been paged.',
  ARRAY['checkout-api', 'payment-api', 'redis-cache'],
  'Customers unable to place orders. ~2,400 failed transactions in last 15 minutes.'
) ON CONFLICT DO NOTHING;