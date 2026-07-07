import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set. The backend will start, but database requests will fail until it is configured.');
}

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// ── DB Pool ─────────────────────────────────────────────────
// Azure PostgreSQL requires SSL. Set DB_SSL=true in production.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }   // Azure flexible server uses self-signed cert
    : false,
});

async function testDBConnection() {
    console.log("Testing database connection...");

    try {
        const client = await pool.connect();

        console.log("✅ Connected");

        const result = await client.query("SELECT NOW()");
        console.log(result.rows);

        client.release();
    } catch (err) {
        console.log("❌ ERROR");
        console.log(err);
    }
}

testDBConnection();

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

// ── Health ──────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch {
    res.status(503).json({ ok: false, db: 'unreachable' });
  }
});

// ── Helpers ─────────────────────────────────────────────────
function formatIncident(row) {
  return {
    id:               row.id ? `INC-${String(row.id).padStart(3, '0')}` : null,
    rawId:            row.id,
    title:            row.title,
    severity:         row.severity,
    severityLabel:    row.severity_label,
    status:           row.status,
    service:          row.service,
    team:             row.team,
    startTime:        row.start_time,
    date:             row.date,
    slo:              row.slo,
    description:      row.description,
    affectedServices: row.affected_services || [],
    customerImpact:   row.customer_impact,
    createdAt:        row.created_at,
  };
}

function formatLogRow(row) {
  return {
    time: row.time,
    service: row.service,
    level: row.level,
    message: row.message,
  };
}

function formatMetricRow(row) {
  return {
    name: row.metric_name,
    label: row.label,
    before: row.before_value,
    after: row.after_value,
    change: row.change_value,
    status: row.status,
    unit: row.unit,
    sparkline: row.sparkline || [],
  };
}

function formatEventRow(row) {
  return {
    time: row.time,
    type: row.type,
    source: row.source,
    reason: row.reason,
    message: row.message,
    count: row.count,
  };
}

function formatTerminalRow(row) {
  return {
    command: row.command,
    output: row.output,
  };
}

function formatRootCauseRow(row) {
  return {
    primaryCause: row.primary_cause,
    explanation: row.explanation,
    keyClues: row.key_clues || [],
    investigationPath: row.investigation_path || [],
    commonMistakes: row.common_mistakes || [],
  };
}

const REQUIRED_FIELDS = [
  'title', 'severity', 'status', 'service',
  'team', 'startTime', 'date', 'slo',
  'description', 'affectedServices', 'customerImpact',
];

function validateIncident(body) {
  const missing = REQUIRED_FIELDS.filter(f => {
    const val = body[f];
    if (f === 'affectedServices') return !Array.isArray(val) || val.length === 0;
    return val === undefined || val === null || String(val).trim() === '';
  });
  return missing;
}

// ── GET /incidents ──────────────────────────────────────────
app.get('/incidents', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, severity, severity_label, status, service, team,
              start_time, date, slo, description, affected_services,
              customer_impact, created_at
       FROM incidents
       ORDER BY id ASC`
    );
    res.json(rows.map(formatIncident));
  } catch (err) {
    console.error('GET /incidents error:', err.message);
    res.status(500).json({ error: 'Failed to load incidents' });
  }
});

// ── GET /incidents/:id ──────────────────────────────────────
app.get('/incidents/:id', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, title, severity, severity_label, status, service, team,
              start_time, date, slo, description, affected_services,
              customer_impact, created_at
       FROM incidents WHERE id = $1`,
      [rawId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Incident not found' });
    res.json(formatIncident(rows[0]));
  } catch (err) {
    console.error('GET /incidents/:id error:', err.message);
    res.status(500).json({ error: 'Failed to load incident' });
  }
});

// ── GET /incidents/:id/logs ───────────────────────────────────
app.get('/incidents/:id/logs', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT to_char(timestamp AT TIME ZONE 'UTC', 'HH24:MI:SS') AS time,
              service, level, message
       FROM incident_logs
       WHERE incident_id = $1
       ORDER BY timestamp ASC`,
      [rawId]
    );
    res.json(rows.map(formatLogRow));
  } catch (err) {
    console.error('GET /incidents/:id/logs error:', err.message);
    res.status(500).json({ error: 'Failed to load incident logs' });
  }
});

// ── GET /incidents/:id/metrics ─────────────────────────────────
app.get('/incidents/:id/metrics', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT metric_name, label, before_value, after_value, change_value, status, unit, sparkline
       FROM incident_metrics
       WHERE incident_id = $1
       ORDER BY id ASC`,
      [rawId]
    );
    res.json(rows.map(formatMetricRow));
  } catch (err) {
    console.error('GET /incidents/:id/metrics error:', err.message);
    res.status(500).json({ error: 'Failed to load incident metrics' });
  }
});

// ── GET /incidents/:id/events ──────────────────────────────────
app.get('/incidents/:id/events', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT to_char(timestamp AT TIME ZONE 'UTC', 'HH24:MI:SS') AS time,
              type, source, reason, message, count
       FROM incident_events
       WHERE incident_id = $1
       ORDER BY timestamp ASC`,
      [rawId]
    );
    res.json(rows.map(formatEventRow));
  } catch (err) {
    console.error('GET /incidents/:id/events error:', err.message);
    res.status(500).json({ error: 'Failed to load incident events' });
  }
});

// ── GET /incidents/:id/terminal ───────────────────────────────
app.get('/incidents/:id/terminal', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT command, output
       FROM terminal_commands
       WHERE incident_id = $1
       ORDER BY id ASC`,
      [rawId]
    );
    res.json(rows.map(formatTerminalRow));
  } catch (err) {
    console.error('GET /incidents/:id/terminal error:', err.message);
    res.status(500).json({ error: 'Failed to load terminal commands' });
  }
});

// ── GET /incidents/:id/root-cause ────────────────────────────
app.get('/incidents/:id/root-cause', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT primary_cause, explanation, key_clues, investigation_path, common_mistakes
       FROM incident_root_cause_analysis
       WHERE incident_id = $1`,
      [rawId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Root cause analysis not found' });
    res.json(formatRootCauseRow(rows[0]));
  } catch (err) {
    console.error('GET /incidents/:id/root-cause error:', err.message);
    res.status(500).json({ error: 'Failed to load root cause analysis' });
  }
});

// ── POST /incidents ─────────────────────────────────────────
app.post('/incidents', async (req, res) => {
  const missing = validateIncident(req.body);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const {
    title, severity, severityLabel, status, service, team,
    startTime, date, slo, description, affectedServices, customerImpact,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO incidents
         (title, severity, severity_label, status, service, team,
          start_time, date, slo, description, affected_services, customer_impact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        title, severity, severityLabel || severity,
        status, service, team,
        startTime, date, slo,
        description, affectedServices, customerImpact,
      ]
    );
    res.status(201).json(formatIncident(rows[0]));
  } catch (err) {
    console.error('POST /incidents error:', err.message);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// ── PUT /incidents/:id ──────────────────────────────────────
app.put('/incidents/:id', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  const missing = validateIncident(req.body);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const {
    title, severity, severityLabel, status, service, team,
    startTime, date, slo, description, affectedServices, customerImpact,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE incidents SET
         title=$1, severity=$2, severity_label=$3, status=$4,
         service=$5, team=$6, start_time=$7, date=$8,
         slo=$9, description=$10, affected_services=$11, customer_impact=$12
       WHERE id=$13
       RETURNING *`,
      [
        title, severity, severityLabel || severity,
        status, service, team,
        startTime, date, slo,
        description, affectedServices, customerImpact,
        rawId,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Incident not found' });
    res.json(formatIncident(rows[0]));
  } catch (err) {
    console.error('PUT /incidents/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// ── DELETE /incidents/:id ───────────────────────────────────
app.delete('/incidents/:id', async (req, res) => {
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId < 1) {
    return res.status(400).json({ error: 'Invalid incident id' });
  }

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM incidents WHERE id = $1', [rawId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Incident not found' });
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /incidents/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

// ── 404 catch-all ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚡ IncidentZero backend`);
  console.log(`  → http://localhost:${PORT}/health\n`);
});
