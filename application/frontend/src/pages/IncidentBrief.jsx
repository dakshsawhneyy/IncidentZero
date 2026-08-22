import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './IncidentBrief.module.css';

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

export default function IncidentBrief() {
  const navigate = useNavigate();
  const [revealed,   setRevealed]   = useState(false);
  const [now,        setNow]        = useState(new Date());
  const [lockedTool, setLockedTool] = useState(null);
  const [incidents,  setIncidents]  = useState([]);
  const [incident,   setIncident]   = useState(null);
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
    fetch(`${API_BASE}/incidents`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
          const chosen = data.find(i => i.rawId === selectedId) || data[0];
          setSelectedId(chosen.rawId);
          setIncident(chosen);
        } else {
          setIncidentError('No incident available.');
        }
      })
      .catch(() => setIncidentError('Unable to load incident data.'));
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

  function selectIncident(item) {
    setIncident(item);
    setSelectedId(item.rawId);
    sessionStorage.setItem('selectedIncidentId', item.rawId);
  }

  const relatedIncidents = incidents
    .filter(i => i.rawId !== incident?.rawId)
    .slice(0, 3);

  return (
    <div className={styles.page}>

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

        {/* Related incidents shelf */}
        {relatedIncidents.length > 0 && (
          <div className={styles.shelf}>
            {relatedIncidents.map(item => (
              <button
                key={item.rawId}
                className={`${styles.shelfCard} ${incident?.rawId === item.rawId ? styles.shelfActive : ''}`}
                onClick={() => selectIncident(item)}
              >
                <div className={styles.shelfTop}>
                  <span className={styles.shelfId}>{item.id}</span>
                  <span className={styles.shelfSev}>{item.severityLabel || item.severity}</span>
                </div>
                <div className={styles.shelfTitle}>{item.title}</div>
                <div className={styles.shelfMeta}>{item.service} · {item.team}</div>
              </button>
            ))}
          </div>
        )}

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
