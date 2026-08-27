import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './IncidentBrief.module.css';
import KubeLoader from './KubeLoader';

const API_BASE = import.meta.env.VITE_API_URL || '';

/* ── Icon components — no emoji ── */
function IconMetrics()  { return <span className={styles.toolIconSvg} aria-hidden="true">▦</span>; }
function IconLogs()     { return <span className={styles.toolIconSvg} aria-hidden="true">≡</span>; }
function IconEvents()   { return <span className={styles.toolIconSvg} aria-hidden="true">◈</span>; }
function IconTerminal() { return <span className={styles.toolIconSvg} aria-hidden="true">&gt;_</span>; }
function IconNotes()    { return <span className={styles.toolIconSvg} aria-hidden="true">✎</span>; }
function IconSubmit()   { return <span className={styles.toolIconSvg} aria-hidden="true">⌲</span>; }
function IconLock()     { return <span className={styles.lockIconSvg} aria-hidden="true">⌗</span>; }

const TOOLS = [
  { id: 'metrics',  Icon: IconMetrics,  label: 'Metrics',      desc: 'Latency, error rate, throughput, Redis' },
  { id: 'logs',     Icon: IconLogs,     label: 'Logs',         desc: 'Application logs from all pods'         },
  { id: 'events',   Icon: IconEvents,   label: 'Events',       desc: 'Kubernetes cluster events'              },
  { id: 'terminal', Icon: IconTerminal, label: 'Terminal',     desc: 'kubectl · production namespace'         },
  { id: 'notes',    Icon: IconNotes,    label: 'Notes',        desc: 'Your investigation scratchpad'          },
  { id: 'rca',      Icon: IconSubmit,   label: 'Submit RCA',   desc: 'Submit when root cause is found'        },
];

/* ── Brand logo ── */
function Logo({ onClick }) {
  return (
    <button className={styles.logo} onClick={onClick} aria-label="Go home">
      <span className={styles.logoMark} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <polygon points="2,1 13,7 2,13" fill="currentColor" />
        </svg>
      </span>
      <span className={styles.logoText}>
        incident<span className={styles.logoAccent}>zero</span>
      </span>
    </button>
  );
}

/* ── Blast radius ticker — live escalating counters ── */
const BLAST_METRICS = [
  {
    label: 'Failed transactions',
    start: 2400,
    perTick: () => Math.floor(Math.random() * 18) + 8,
    color: 'var(--red-soft)',
    bg: 'var(--red-dim)',
    border: 'var(--red-border)',
    prefix: '',
    suffix: '',
  },
  {
    label: 'Users affected',
    start: 1180,
    perTick: () => Math.floor(Math.random() * 12) + 4,
    color: 'var(--orange)',
    bg: 'var(--orange-dim)',
    border: 'var(--orange-border)',
    prefix: '~',
    suffix: '',
  },
  {
    label: 'Error rate',
    start: 183,   // stored as tenths: 18.3%
    perTick: () => Math.floor(Math.random() * 3) + 1,
    color: 'var(--yellow)',
    bg: 'var(--yellow-dim)',
    border: 'var(--yellow-border)',
    prefix: '',
    suffix: '%',
    format: v => (v / 10).toFixed(1),
  },
  {
    label: 'P99 latency',
    start: 1247,
    perTick: () => Math.floor(Math.random() * 40) + 10,
    color: 'var(--red-soft)',
    bg: 'var(--red-dim)',
    border: 'var(--red-border)',
    prefix: '',
    suffix: 'ms',
  },
];

function BlastRadius() {
  const [values, setValues] = useState(BLAST_METRICS.map(m => m.start));
  const [flash,  setFlash]  = useState(Array(BLAST_METRICS.length).fill(false));

  useEffect(() => {
    const id = setInterval(() => {
      setValues(prev => prev.map((v, i) => v + BLAST_METRICS[i].perTick()));
      // flash a random metric each tick for urgency
      const pick = Math.floor(Math.random() * BLAST_METRICS.length);
      setFlash(prev => prev.map((_, i) => i === pick));
      setTimeout(() => setFlash(Array(BLAST_METRICS.length).fill(false)), 300);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.blastWrap}>
      {/* Header row */}
      <div className={styles.blastHeader}>
        <span className={styles.blastPulse} />
        <span className={styles.blastTitle}>BLAST RADIUS — LIVE</span>
        <span className={styles.blastSub}>escalating every second you wait</span>
      </div>

      {/* Metric tiles */}
      <div className={styles.blastGrid}>
        {BLAST_METRICS.map((m, i) => {
          const raw = values[i];
          const display = m.format ? m.format(raw) : raw.toLocaleString();
          return (
            <div
              key={m.label}
              className={`${styles.blastTile} ${flash[i] ? styles.blastTileFlash : ''}`}
              style={{ borderColor: m.border }}
            >
              <span className={styles.blastTileValue} style={{ color: m.color }}>
                {m.prefix}{display}{m.suffix}
              </span>
              <span className={styles.blastTileLabel}>{m.label}</span>
              <span className={styles.blastTileTrend} style={{ color: m.color }}>↑</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IncidentBrief() {
  const navigate = useNavigate();
  const [revealed,   setRevealed]   = useState(false);
  const [now,        setNow]        = useState(new Date());
  const [lockedTool, setLockedTool] = useState(null);
  const [incident,   setIncident]   = useState(null);
  const [incidentLoading, setIncidentLoading] = useState(true);
  const [incidentError, setIncidentError] = useState('');
  const [selectedId, setSelectedId] = useState(() => {
    const s = Number(sessionStorage.getItem('selectedIncidentId'));
    return Number.isInteger(s) && s > 0 ? s : null;
  });

  useEffect(() => { const t = setTimeout(() => setRevealed(true), 260); return () => clearTimeout(t); }, []);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setLockedTool(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    function doFetch() {
      fetch(`${API_BASE}/incidents`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (Array.isArray(data) && data.length > 0) {
            const storedId = Number(sessionStorage.getItem('selectedIncidentId'));
            const chosen = data.find(i => Number(i.rawId) === storedId) || data[0];
            setSelectedId(Number(chosen.rawId));
            setIncident(chosen);
            setIncidentLoading(false);
          } else {
            // Empty response — retry in 3s
            if (!cancelled) retryTimer = setTimeout(doFetch, 3000);
          }
        })
        .catch(() => {
          // Network error — retry in 3s, keep loader showing
          if (!cancelled) retryTimer = setTimeout(doFetch, 3000);
        });
    }

    doFetch();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const meta = incident
    ? { ...incident, severityLabel: incident.severityLabel || (incident.severity ? incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) : 'Critical') }
    : null;

  function handleStart() {
    if (incident?.rawId) sessionStorage.setItem('selectedIncidentId', incident.rawId);
    sessionStorage.setItem('incidentStart', Date.now().toString());
    navigate('/investigate');
  }

  return (
    <div className={styles.page}>

      {/* K8s terminal overlay — shown until incident data loads */}
      {incidentLoading && <KubeLoader />}

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <Logo onClick={() => navigate('/')} />
        <div className={styles.topbarCenter}>
          <span className={styles.clock}>{timeStr} UTC</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.oncallBadge}>You are On-Call</span>
        </div>
      </header>

      {/* ── Main ── */}
      <div className={`${styles.main} ${revealed ? styles.visible : ''}`}>

        {/* Blast radius ticker */}
        <BlastRadius />

        {/* ── Alert card ── */}
        <div className={styles.alertCard}>
          <div className={styles.alertHeader}>
            <div className={styles.alertSource}>
              <span className={styles.alertPulse} />
              <span className={styles.alertSourceName}>PagerDuty</span>
              <span className={styles.alertDot}>·</span>
              <span className={styles.alertTime}>{meta?.date || '—'} · {meta?.startTime || '—'}</span>
            </div>
            <span className={styles.alertSeverityBadge}>{meta?.severityLabel || 'Critical'}</span>
          </div>

          <div className={styles.alertBody}>
            <h1 className={styles.alertTitle}>{meta?.title || incidentError || 'Loading incident…'}</h1>
            <p className={styles.alertDesc}>{meta?.description || 'Waiting for backend data.'}</p>
          </div>

          <div className={styles.alertGrid}>
            <div className={styles.alertField}>
              <span className={styles.fieldLabel}>Incident ID</span>
              <span className={`${styles.fieldValue} ${styles.fieldMono}`}>{meta?.id || '—'}</span>
            </div>
            <div className={styles.alertField}>
              <span className={styles.fieldLabel}>Affected Service</span>
              <span className={styles.fieldValue}>{meta?.service || '—'}</span>
            </div>
            <div className={styles.alertField}>
              <span className={styles.fieldLabel}>SLO Breached</span>
              <span className={`${styles.fieldValue} ${styles.fieldRed}`}>{meta?.slo || '—'}</span>
            </div>
            <div className={styles.alertField}>
              <span className={styles.fieldLabel}>Team</span>
              <span className={styles.fieldValue}>{meta?.team || '—'}</span>
            </div>
          </div>

          {meta?.customerImpact && (
            <div className={styles.impactRow}>
              <span className={styles.impactLabel}>Impact</span>
              <span className={styles.impactText}>{meta.customerImpact}</span>
            </div>
          )}

          {(meta?.affectedServices || []).length > 0 && (
            <div className={styles.servicesRow}>
              <span className={styles.servicesLabel}>Affected services</span>
              <div className={styles.servicesList}>
                {(meta.affectedServices).map(s => (
                  <span key={s} className={styles.serviceChip}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tools panel ── */}
        <div className={styles.toolsPanel}>
          <div className={styles.toolsPanelHeader}>
            <span className={styles.toolsPanelLabel}>Available tools</span>
            <span className={styles.toolsPanelHint}>Locked until investigation starts</span>
          </div>
          <div className={styles.toolsGrid}>
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                className={styles.toolCard}
                onClick={() => setLockedTool(tool)}
              >
                <tool.Icon />
                <div className={styles.toolText}>
                  <span className={styles.toolLabel}>{tool.label}</span>
                  <span className={styles.toolDesc}>{tool.desc}</span>
                </div>
                <IconLock />
              </button>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaWarning}>
            <span className={styles.ctaWarningDot} />
            Timer starts when you click. Investigate at your own pace — but the clock is watching.
          </div>
          <div className={styles.ctaActions}>
            <button className={styles.startBtn} onClick={handleStart}>
              <span className={styles.startBtnDot} />
              Start Investigation
            </button>
            <button className={styles.browseBtn} onClick={() => navigate('/incidents')}>
              Browse other incidents
            </button>
          </div>
          <p className={styles.ctaNote}>No instructions. No hints. Just signals, logs, and a timer.</p>
        </div>

      </div>

      {/* ── Locked tool modal ── */}
      {lockedTool && (
        <div className={styles.backdrop} onClick={() => setLockedTool(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <lockedTool.Icon />
              <span className={styles.modalToolName}>{lockedTool.label}</span>
            </div>
            <div className={styles.modalBody}>
              <span className={styles.modalLockIcon}>⌗</span>
              <h3 className={styles.modalTitle}>Locked until investigation starts</h3>
              <p className={styles.modalDesc}><strong>{lockedTool.label}</strong> — {lockedTool.desc}.</p>
              <p className={styles.modalHint}>
                Start the investigation to unlock all tools and begin your timer.
                Everything you need is in there.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalDismiss} onClick={() => setLockedTool(null)}>
                Not yet
              </button>
              <button className={styles.modalStart} onClick={handleStart}>
                <span className={styles.startBtnDot} style={{ background: '#fff' }} />
                Start Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
