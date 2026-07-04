import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './IncidentBrief.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function IncidentBrief() {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [lockedTool, setLockedTool] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(() => {
    const stored = Number(sessionStorage.getItem('selectedIncidentId'));
    return Number.isInteger(stored) && stored > 0 ? stored : null;
  });
  const [incident, setIncident] = useState(null);
  const [incidentError, setIncidentError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setLockedTool(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/incidents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
          const chosen = data.find(item => item.rawId === selectedIncidentId) || data[0];
          setSelectedIncidentId(chosen.rawId);
          setIncident(chosen);
        } else {
          setIncident(null);
          setIncidentError('No incident is available yet.');
        }
      })
      .catch(() => setIncidentError('Unable to load incident data from the backend.'));
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const incidentMeta = incident
    ? {
        ...incident,
        severityLabel: incident.severityLabel || (incident.severity ? incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) : 'Critical'),
      }
    : null;

  function handleStart() {
    if (incident?.rawId) sessionStorage.setItem('selectedIncidentId', incident.rawId);
    sessionStorage.setItem('incidentStart', Date.now().toString());
    navigate('/investigate');
  }

  const incidentCount = incidents.length;

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>Incident<strong>Zero</strong></span>
        </div>
        <div className={styles.topbarCenter}>
          <span className={styles.clock}>{timeStr}</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.oncallLabel}>You are On-Call</span>
        </div>
      </div>

      {/* Main */}
      <div className={`${styles.main} ${revealed ? styles.visible : ''}`}>
        {incidentCount > 1 && (
          <div className={styles.incidentShelf}>
            {incidents.map((item) => (
              <button
                key={item.rawId}
                className={`${styles.incidentShelfItem} ${incident?.rawId === item.rawId ? styles.incidentShelfActive : ''}`}
                onClick={() => {
                  setIncident(item);
                  setSelectedIncidentId(item.rawId);
                  sessionStorage.setItem('selectedIncidentId', item.rawId);
                }}
              >
                <div className={styles.incidentShelfHeader}>
                  <span className={styles.incidentShelfId}>{item.id}</span>
                  <span className={styles.incidentShelfSeverity}>{item.severityLabel || item.severity}</span>
                </div>
                <div className={styles.incidentShelfTitle}>{item.title}</div>
                <div className={styles.incidentShelfMeta}>{item.service} · {item.team}</div>
              </button>
            ))}
          </div>
        )}

        {/* PagerDuty-style alert */}
        <div className={styles.pdCard}>
          <div className={styles.pdHeader}>
            <div className={styles.pdSource}>
              <span className={styles.pdFlash}>🔴</span>
              <span className={styles.pdSourceText}>PagerDuty</span>
              <span className={styles.pdSep}>·</span>
              <span className={styles.pdSourceTime}>{incidentMeta?.date || 'Loading…'} · {incidentMeta?.startTime || '—'}</span>
            </div>
            <span className={styles.pdSeverity}>{incidentMeta?.severityLabel || incidentMeta?.severity || 'Critical'}</span>
          </div>

          <div className={styles.pdBody}>
            <h1 className={styles.pdTitle}>🚨 {incidentMeta?.title || 'Loading incident…'}</h1>
            <p className={styles.pdDesc}>{incidentMeta?.description || incidentError || 'Waiting for the backend to provide incident data.'}</p>
          </div>

          <div className={styles.pdMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Incident ID</span>
              <span className={`${styles.metaValue} ${styles.mono}`}>{incidentMeta?.id || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Affected Service</span>
              <span className={styles.metaValue}>{incidentMeta?.service || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>SLO Breached</span>
              <span className={`${styles.metaValue} ${styles.metaRed}`}>{incidentMeta?.slo || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Team</span>
              <span className={styles.metaValue}>{incidentMeta?.team || '—'}</span>
            </div>
          </div>

          <div className={styles.impactBox}>
            <span className={styles.impactIcon}>⚠️</span>
            <span className={styles.impactText}>{incidentMeta?.customerImpact || '—'}</span>
          </div>

          <div className={styles.affectedServices}>
            <span className={styles.affectedLabel}>Affected Services</span>
            <div className={styles.serviceList}>
              {(incidentMeta?.affectedServices || []).map((s) => (
                <span key={s} className={styles.serviceBadge}>{s}</span>
              ))}
            </div>
          </div>

          <div className={styles.browseRow}>
            <button className={styles.viewAllBtn} onClick={() => navigate('/incidents')}>
              Didn’t like this incident? View all incidents
            </button>
          </div>
        </div>

        {/* Instructions panel */}
        <div className={styles.instructions}>
          <div className={styles.instrHeader}>
            <h2 className={styles.instrTitle}>What's available</h2>
          </div>
          <div className={styles.instrGrid}>
            {[
              { icon: '📊', label: 'Metrics', desc: 'Latency, error rate, throughput, Redis metrics' },
              { icon: '📄', label: 'Logs', desc: 'Application and service logs from all pods' },
              { icon: '⚡', label: 'Events', desc: 'Kubernetes cluster events' },
              { icon: '💻', label: 'Terminal', desc: 'kubectl, limited commands available' },
              { icon: '📝', label: 'Notes', desc: 'Your investigation notebook' },
              { icon: '🏁', label: 'Submit RCA', desc: 'Submit when you know the root cause' },
            ].map(tool => (
              <div
                key={tool.label}
                className={styles.toolCard}
                onClick={() => setLockedTool(tool)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setLockedTool(tool)}
              >
                <span className={styles.toolIcon}>{tool.icon}</span>
                <div>
                  <div className={styles.toolLabel}>{tool.label}</div>
                  <div className={styles.toolDesc}>{tool.desc}</div>
                </div>
                <span className={styles.toolLock}>🔒</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={styles.ctaBox}>
          <div className={styles.ctaWarning}>
            <span>⏱</span>
            <span>Timer starts when you click. Investigate at your own pace — but the clock is watching.</span>
          </div>
          <button className={styles.startBtn} onClick={handleStart}>
            <span className={styles.startDot}></span>
            Start Investigation
          </button>
          <p className={styles.ctaNote}>
            No instructions. No hints. Just signals, logs, and a timer.
          </p>
        </div>
      </div>

      {/* ── Locked Tool Modal ── */}
      {lockedTool && (
        <div className={styles.lockBackdrop} onClick={() => setLockedTool(null)}>
          <div className={styles.lockModal} onClick={e => e.stopPropagation()}>
            <div className={styles.lockModalHeader}>
              <span className={styles.lockModalIcon}>{lockedTool.icon}</span>
              <span className={styles.lockModalName}>{lockedTool.label}</span>
            </div>
            <div className={styles.lockModalBody}>
              <div className={styles.lockIcon}>🔒</div>
              <h3 className={styles.lockTitle}>Locked until investigation starts</h3>
              <p className={styles.lockDesc}>
                <strong>{lockedTool.label}</strong> — {lockedTool.desc}.
              </p>
              <p className={styles.lockHint}>
                Start the investigation to unlock all tools and begin your timer.
                Everything you need to solve this incident is in there.
              </p>
            </div>
            <div className={styles.lockModalFooter}>
              <button className={styles.lockDismiss} onClick={() => setLockedTool(null)}>
                Not yet
              </button>
              <button className={styles.lockStart} onClick={handleStart}>
                <span className={styles.lockStartDot} />
                Start Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
