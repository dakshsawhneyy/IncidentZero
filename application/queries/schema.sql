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


CREATE TABLE IF NOT EXISTS incident_logs (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL
        REFERENCES incidents(id)
        ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    service TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS incident_metrics (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL
        REFERENCES incidents(id)
        ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    label TEXT NOT NULL,
    before_value TEXT,
    after_value TEXT,
    change_value TEXT,
    status TEXT,
    unit TEXT,
    sparkline JSONB
);

CREATE TABLE IF NOT EXISTS incident_events (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES incidents(id),
  timestamp TIMESTAMPTZ,
  type TEXT,
  source TEXT,
  reason TEXT,
  message TEXT,
  count INTEGER
);

CREATE TABLE IF NOT EXISTS terminal_commands (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES incidents(id),
  command TEXT,
  output TEXT
);

