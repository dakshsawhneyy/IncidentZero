import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Incidents.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const SEVERITY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

const SEV_META = {
  critical: { color: 'var(--red-soft)',   bg: 'var(--red-dim)',    border: 'var(--red-border)',    dot: '#ef4444', bar: 'var(--red)'    },
  high:     { color: 'var(--orange)',      bg: 'var(--orange-dim)', border: 'var(--orange-border)', dot: '#f97316', bar: 'var(--orange)' },
  medium:   { color: 'var(--yellow)',      bg: 'var(--yellow-dim)', border: 'var(--yellow-border)', dot: '#eab308', bar: 'var(--yellow)' },
  low:      { color: 'var(--green-soft)',  bg: 'var(--green-dim)',  border: 'var(--green-border)',  dot: '#22c55e', bar: 'var(--green)'  },
};

function normSev(inc) {
  return (inc.severityLabel || inc.severity || '').toString().trim().toLowerCase();
}

function SevBadge({ sev }) {
  const s = SEV_META[sev] || SEV_META.critical;
  return (
    <span className={styles.sevBadge} style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {sev.toUpperCase()}
    </span>
  );
}

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents]         = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [filter, setFilter]               = useState('All');
  const [error, setError]                 = useState('');
  const [hoveredId, setHoveredId]         = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/incidents`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setError('Unexpected response.'); return; }
        setIncidents(data);
        const stored = Number(sessionStorage.getItem('selectedIncidentId'));
        const def = data.find(i => i.rawId === stored) || data[0] || null;
        if (def) setSelectedId(def.rawId);
      })
      .catch(() => setError('Unable to load incidents.'));
  }, []);

  const filtered = incidents.filter(i =>
    filter === 'All' || normSev(i) === filter.toLowerCase()
  );

  const selected = filtered.find(i => i.rawId === selectedId)
    || filtered[0]
    || null;

  function pick(inc) {
    setSelectedId(inc.rawId);
    sessionStorage.setItem('selectedIncidentId', inc.rawId);
  }

  function open(inc) {
    sessionStorage.setItem('selectedIncidentId', inc.rawId);
    sessionStorage.setItem('incidentStart', Date.now().toString());
    navigate('/investigate');
  }

  const sev       = selected ? normSev(selected) : 'critical';
  const sevStyle  = SEV_META[sev] || SEV_META.critical;

  return (
    <div className={styles.page}>

      {/* ── Header bar ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <polygon points="2,1 13,7 2,13" fill="currentColor" />
          </svg>
          incidentzero
        </button>

        <div className={styles.headerCenter}>
          <span className={styles.headerPulse} />
          <span className={styles.headerLabel}>
            {incidents.length > 0
              ? `${incidents.length} incident${incidents.length !== 1 ? 's' : ''} available`
              : 'loading incidents…'}
          </span>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.headerChip}>INCIDENT SHOWCASE</span>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className={styles.layout}>

        {/* ── LEFT: incident list ── */}
        <aside className={styles.list}>

          {/* Severity filter pills */}
          <div className={styles.filters}>
            {SEVERITY_FILTERS.map(f => {
              const s = SEV_META[f.toLowerCase()];
              const active = filter === f;
              return (
                <button
                  key={f}
                  className={`${styles.filterPill} ${active ? styles.filterActive : ''}`}
                  style={active && s ? { color: s.color, background: s.bg, borderColor: s.border } : {}}
                  onClick={() => setFilter(f)}
                >
                  {f === 'All' && <span className={styles.filterAllDot} />}
                  {f !== 'All' && s && (
                    <span className={styles.filterDot} style={{ background: s.dot }} />
                  )}
                  {f}
                </button>
              );
            })}
          </div>

          {/* Incident cards */}
          <div className={styles.cards}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>No {filter.toLowerCase()} incidents.</div>
            ) : filtered.map(inc => {
              const sv = normSev(inc);
              const sm = SEV_META[sv] || SEV_META.critical;
              const isSelected = selected?.rawId === inc.rawId;
              const isHovered  = hoveredId === inc.rawId;
              return (
                <button
                  key={inc.rawId}
                  className={`${styles.card} ${isSelected ? styles.cardActive : ''}`}
                  onClick={() => pick(inc)}
                  onMouseEnter={() => setHoveredId(inc.rawId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* severity bar on left edge */}
                  <span className={styles.cardBar} style={{ background: sm.bar }} />

                  <div className={styles.cardInner}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardId}>{inc.id}</span>
                      <SevBadge sev={sv} />
                    </div>
                    <div className={styles.cardTitle}>{inc.title}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardSvc}>{inc.service}</span>
                      <span className={styles.cardDot}>·</span>
                      <span>{inc.team}</span>
                    </div>

                    {/* animated bottom bar on hover/active */}
                    <div
                      className={styles.cardHoverBar}
                      style={{
                        background: sm.bar,
                        transform: (isSelected || isHovered) ? 'scaleX(1)' : 'scaleX(0)',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT: detail panel ── */}
        <main className={styles.detail}>
          {selected ? (
            <>
              {/* Top accent line matches severity */}
              <div className={styles.detailAccent} style={{ background: `linear-gradient(90deg, ${sevStyle.bar} 0%, transparent 70%)` }} />

              {/* Detail header */}
              <div className={styles.detailHead}>
                <div className={styles.detailHeadLeft}>
                  <div className={styles.detailSevRow}>
                    <span className={styles.detailPulse} style={{ background: sevStyle.dot, boxShadow: `0 0 8px ${sevStyle.dot}` }} />
                    <SevBadge sev={sev} />
                    <span className={styles.detailId}>{selected.id}</span>
                  </div>
                  <h1 className={styles.detailTitle}>{selected.title}</h1>
                </div>
                <button className={styles.openBtn} onClick={() => open(selected)}>
                  <span className={styles.openBtnDot} />
                  Start investigation
                </button>
              </div>

              {/* Meta grid */}
              <div className={styles.metaGrid}>
                {[
                  { label: 'Service',  value: selected.service },
                  { label: 'Team',     value: selected.team },
                  { label: 'Date',     value: selected.date },
                  { label: 'Severity', value: selected.severityLabel || selected.severity },
                ].map(m => (
                  <div key={m.label} className={styles.metaCell}>
                    <span className={styles.metaLabel}>{m.label}</span>
                    <span className={styles.metaValue}>{m.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className={styles.descSection}>
                <span className={styles.sectionTag}>DESCRIPTION</span>
                <p className={styles.descText}>{selected.description}</p>
              </div>

              {/* Impact */}
              {selected.customerImpact && (
                <div className={styles.impactBanner}>
                  <span className={styles.impactIcon} style={{ background: sevStyle.dot }} />
                  <div>
                    <span className={styles.impactTag}>IMPACT</span>
                    <span className={styles.impactText}>{selected.customerImpact}</span>
                  </div>
                </div>
              )}

              {/* Affected services */}
              {(selected.affectedServices || []).length > 0 && (
                <div className={styles.servicesSection}>
                  <span className={styles.sectionTag}>AFFECTED SERVICES</span>
                  <div className={styles.servicesList}>
                    {(selected.affectedServices).map(s => (
                      <span key={s} className={styles.svcChip}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* What you'll use */}
              <div className={styles.toolsTeaser}>
                <span className={styles.sectionTag}>TOOLS AVAILABLE</span>
                <div className={styles.toolsList}>
                  {[
                    { icon: '▦', label: 'Metrics',   desc: 'CPU, memory, latency, error rate' },
                    { icon: '≡', label: 'Logs',      desc: 'Live application logs' },
                    { icon: '◈', label: 'Events',    desc: 'K8s cluster events' },
                    { icon: '>_',label: 'Terminal',  desc: 'kubectl — production ns' },
                  ].map(t => (
                    <div key={t.label} className={styles.toolItem}>
                      <span className={styles.toolIcon}>{t.icon}</span>
                      <div>
                        <span className={styles.toolLabel}>{t.label}</span>
                        <span className={styles.toolDesc}>{t.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA bottom */}
              <div className={styles.detailCta}>
                <button className={styles.openBtn} onClick={() => open(selected)}>
                  <span className={styles.openBtnDot} />
                  Start investigation
                </button>
                <span className={styles.ctaNote}>Timer starts on click · no hints · no walkthroughs</span>
              </div>
            </>
          ) : (
            <div className={styles.emptyDetail}>
              <span className={styles.emptyDetailIcon}>◈</span>
              <span>Select an incident to preview</span>
            </div>
          )}
        </main>
      </div>

      {error && <div className={styles.errorBar}>{error}</div>}
    </div>
  );
}
