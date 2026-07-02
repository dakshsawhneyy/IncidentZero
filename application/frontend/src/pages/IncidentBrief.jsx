import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incident001 } from '../data/incident001';
import styles from './IncidentBrief.module.css';

export default function IncidentBrief() {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [lockedTool, setLockedTool] = useState(null);

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

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  function handleStart() {
    sessionStorage.setItem('incidentStart', Date.now().toString());
    navigate('/investigate');
  }

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
        {/* PagerDuty-style alert */}
        <div className={styles.pdCard}>
          <div className={styles.pdHeader}>
            <div className={styles.pdSource}>
              <span className={styles.pdFlash}>🔴</span>
              <span className={styles.pdSourceText}>PagerDuty</span>
              <span className={styles.pdSep}>·</span>
              <span className={styles.pdSourceTime}>{incident001.date} · {incident001.startTime}</span>
            </div>
            <span className={styles.pdSeverity}>P1 · Critical</span>
          </div>

          <div className={styles.pdBody}>
            <h1 className={styles.pdTitle}>🚨 {incident001.title}</h1>
            <p className={styles.pdDesc}>{incident001.description}</p>
          </div>

          <div className={styles.pdMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Incident ID</span>
              <span className={`${styles.metaValue} ${styles.mono}`}>{incident001.id}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Affected Service</span>
              <span className={styles.metaValue}>{incident001.service}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>SLO Breached</span>
              <span className={`${styles.metaValue} ${styles.metaRed}`}>{incident001.slo}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Team</span>
              <span className={styles.metaValue}>{incident001.team}</span>
            </div>
          </div>

          <div className={styles.impactBox}>
            <span className={styles.impactIcon}>⚠️</span>
            <span className={styles.impactText}>{incident001.customerImpact}</span>
          </div>

          <div className={styles.affectedServices}>
            <span className={styles.affectedLabel}>Affected Services</span>
            <div className={styles.serviceList}>
              {incident001.affectedServices.map(s => (
                <span key={s} className={styles.serviceBadge}>{s}</span>
              ))}
            </div>
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
