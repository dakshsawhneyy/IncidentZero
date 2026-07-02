import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 4001;

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
