import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Investigation.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/* ── Metrics Panel ── */
function MetricsPanel({ metrics }) {
  const statusColor = { critical: 'var(--red)', warning: 'var(--yellow)', healthy: 'var(--green)' };

  function Spark({ data, status }) {
    if (!Array.isArray(data) || data.length === 0) {
      return <div className={styles.sparkPlaceholder}>No data</div>;
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 120, h = 36, pad = 2;
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={w} height={h} className={styles.spark}>
        <polyline points={pts} fill="none" stroke={statusColor[status]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      </svg>
    );
  }

  return (
    <div className={styles.metricsGrid}>
      {metrics.map(m => (
        <div key={m.label} className={`${styles.metricCard} ${styles[m.status]}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>{m.label}</span>
            <span className={`${styles.metricBadge} ${styles[`badge_${m.status}`]}`}>
              {m.status === 'critical' ? '🔴' : m.status === 'warning' ? '🟡' : '🟢'} {m.status}
            </span>
          </div>
          <Spark data={m.sparkline} status={m.status} />
          <div className={styles.metricValues}>
            <div className={styles.metricCurrent}>{m.after}</div>
            <div className={styles.metricChange}>{m.change} from {m.before}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Logs Panel ── */
function LogsPanel({ logs }) {
  const levelStyle = {
    ERROR: styles.logError,
    WARN:  styles.logWarn,
    INFO:  styles.logInfo,
  };

  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className={styles.logsPanel}>
      <div className={styles.logToolbar}>
        <div className={styles.logFilters}>
          {['ALL', 'ERROR', 'WARN', 'INFO'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className={styles.logCount}>{filtered.length} lines</span>
      </div>
      <div className={styles.logList}>
        {filtered.map((l, i) => (
          <div key={i} className={`${styles.logRow} ${levelStyle[l.level] || ''}`}>
            <span className={styles.logTime}>{l.time}</span>
            <span className={`${styles.logLevel} ${levelStyle[l.level] || ''}`}>{l.level}</span>
            <span className={styles.logService}>{l.service}</span>
            <span className={styles.logMsg}>{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Events Panel ── */
function EventsPanel({ events }) {
  const typeColor = { Warning: styles.eventWarning, Normal: styles.eventNormal };

  return (
    <div className={styles.eventsPanel}>
      <div className={styles.eventsHeader}>
        <span className={styles.eventsTotal}>{events.length} events</span>
      </div>
      <div className={styles.eventList}>
        {events.map((e, i) => (
          <div key={i} className={`${styles.eventRow} ${typeColor[e.type] || ''}`}>
            <div className={styles.eventMeta}>
              <span className={`${styles.eventType} ${typeColor[e.type]}`}>{e.type}</span>
              <span className={styles.eventTime}>{e.time}</span>
              <span className={styles.eventSource}>{e.source}</span>
              <span className={styles.eventReason}>{e.reason}</span>
              {e.count > 1 && <span className={styles.eventCount}>×{e.count}</span>}
            </div>
            <div className={styles.eventMsg}>{e.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Terminal Panel ── */
function TerminalPanel({ terminalResponses }) {
  const [history, setHistory] = useState([
    { type: 'info', text: 'Incident Zero — Investigation Terminal' },
    { type: 'info', text: 'Context: production namespace  |  Try: kubectl get pods' },
    { type: 'info', text: '─'.repeat(58) },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  function runCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newHistory = [...history, { type: 'cmd', text: trimmed }];
    const key = trimmed.toLowerCase();
    const matched = Object.entries(terminalResponses).find(
      ([k]) => k.toLowerCase() === key
    );

    if (matched) {
      newHistory.push({ type: 'output', text: matched[1] });
    } else if (trimmed === 'clear') {
      setHistory([{ type: 'info', text: 'Terminal cleared.' }]);
      setInput('');
      setCmdHistory(prev => [trimmed, ...prev]);
      setHistIdx(-1);
      return;
    } else if (trimmed === 'help') {
      newHistory.push({
        type: 'output',
        text: `Available commands:\n  kubectl get pods\n  kubectl get pods -n production\n  kubectl logs <pod-name>\n  kubectl logs redis-cache-0\n  kubectl describe pod redis-cache-0\n  kubectl top pods\n  kubectl get events\n  kubectl get svc\n  kubectl get hpa\n  kubectl rollout history deployment/checkout-api\n  clear`
      });
    } else {
      newHistory.push({ type: 'error', text: `command not found: ${trimmed}\nType 'help' for available commands.` });
    }

    setHistory(newHistory);
    setInput('');
    setCmdHistory(prev => [trimmed, ...prev]);
    setHistIdx(-1);
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      runCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(newIdx);
      setInput(cmdHistory[newIdx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? '' : cmdHistory[newIdx]);
    }
  }

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
      <div className={styles.terminalOutput}>
        {history.map((h, i) => (
          <div key={i} className={`${styles.termLine} ${styles[`term_${h.type}`]}`}>
            {h.type === 'cmd' && <span className={styles.termPrompt}>$ </span>}
            <pre className={styles.termPre}>{h.text}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles.terminalInput}>
        <span className={styles.termPrompt}>$</span>
        <input
          ref={inputRef}
          className={styles.termInputField}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="kubectl get pods"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

/* ── Notes Panel ── */
function NotesPanel({ notes, setNotes }) {
  return (
    <div className={styles.notesPanel}>
      <div className={styles.notesHeader}>
        <span>📝 Investigation Notes</span>
        <span className={styles.notesHint}>Your private scratchpad</span>
      </div>
      <textarea
        className={styles.notesArea}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder={`Use this to track your thinking...\n\nExample:\n- Redis latency spike at 07:12:58\n- Circuit breaker opened at 07:13:03\n- Hypothesis: Redis memory exhaustion?\n- Check: kubectl top pods`}
        spellCheck={false}
      />
    </div>
  );
}

/* ── RCA Panel ── */
function RCAPanel({ whatHappened, setWhatHappened, rootCause, setRootCause, howFix, setHowFix, onSubmit }) {
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!rootCause.trim()) {
      setError('Root cause is required before submitting.');
      return;
    }
    setError('');
    onSubmit({ whatHappened, rootCause, howFix });
  }

  return (
    <div className={styles.rcaPanel}>
      <div className={styles.rcaHeader}>
        <span>🏁 Submit Root Cause Analysis</span>
        <div className={styles.rcaHeaderRight}>
          {(whatHappened || rootCause || howFix) && (
            <span className={styles.draftSaved}>● draft saved</span>
          )}
          <span className={styles.rcaHint}>Take your time — quality over speed</span>
        </div>
      </div>
      <div className={styles.rcaForm}>
        <label className={styles.rcaLabel}>What happened? <span className={styles.rcaOptional}>(optional)</span></label>
        <textarea
          className={styles.rcaTextarea}
          rows={3}
          value={whatHappened}
          onChange={e => setWhatHappened(e.target.value)}
          placeholder="Describe the symptoms and timeline you observed..."
        />

        <label className={styles.rcaLabel}>Root Cause <span className={styles.rcaRequired}>*</span></label>
        <textarea
          className={styles.rcaTextarea}
          rows={4}
          value={rootCause}
          onChange={e => setRootCause(e.target.value)}
          placeholder="What was the actual root cause of this incident?"
        />

        <label className={styles.rcaLabel}>How would you fix or prevent it? <span className={styles.rcaOptional}>(optional)</span></label>
        <textarea
          className={styles.rcaTextarea}
          rows={3}
          value={howFix}
          onChange={e => setHowFix(e.target.value)}
          placeholder="Immediate fix and long-term prevention..."
        />

        {error && <div className={styles.rcaError}>{error}</div>}

        <button className={styles.rcaSubmit} onClick={handleSubmit}>
          Submit RCA
        </button>
      </div>
    </div>
  );
}

/* ── Main Investigation Page ── */
const TABS = [
  { id: 'metrics',  label: 'Metrics',  icon: '📊' },
  { id: 'logs',     label: 'Logs',     icon: '📄' },
  { id: 'events',   label: 'Events',   icon: '⚡' },
  { id: 'terminal', label: 'Terminal', icon: '💻' },
  { id: 'notes',    label: 'Notes',    icon: '📝' },
  { id: 'rca',      label: 'Submit RCA', icon: '🏁' },
];

export default function Investigation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('metrics');
  const [elapsed, setElapsed] = useState(0);
  const [tabVisits, setTabVisits] = useState({});
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(() => {
    const stored = Number(sessionStorage.getItem('selectedIncidentId'));
    return Number.isInteger(stored) && stored > 0 ? stored : null;
  });
  const [incident, setIncident] = useState(null);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [events, setEvents] = useState([]);
  const [terminalResponses, setTerminalResponses] = useState({});

  // Notes — persisted so tab switches don't lose content
  const [notes, setNotesState] = useState(
    () => sessionStorage.getItem('iz_notes') || ''
  );
  function setNotes(v) {
    setNotesState(v);
    sessionStorage.setItem('iz_notes', v);
  }

  // RCA fields — lifted up so they survive tab switches + persisted
  const [whatHappened, setWhatHappenedState] = useState(
    () => sessionStorage.getItem('iz_rca_what') || ''
  );
  const [rootCause, setRootCauseState] = useState(
    () => sessionStorage.getItem('iz_rca_root') || ''
  );
  const [howFix, setHowFixState] = useState(
    () => sessionStorage.getItem('iz_rca_fix') || ''
  );

  function setWhatHappened(v) {
    setWhatHappenedState(v);
    sessionStorage.setItem('iz_rca_what', v);
  }
  function setRootCause(v) {
    setRootCauseState(v);
    sessionStorage.setItem('iz_rca_root', v);
  }
  function setHowFix(v) {
    setHowFixState(v);
    sessionStorage.setItem('iz_rca_fix', v);
  }

  useEffect(() => {
    const start = parseInt(sessionStorage.getItem('incidentStart') || Date.now().toString(), 10);
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(tick);
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
          sessionStorage.setItem('selectedIncidentId', chosen.rawId);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!incident?.rawId) return;

    const incidentId = incident.rawId;
    const fetchLogs = fetch(`${API_BASE}/incidents/${incidentId}/logs`).then(r => r.json());
    const fetchMetrics = fetch(`${API_BASE}/incidents/${incidentId}/metrics`).then(r => r.json());
    const fetchEvents = fetch(`${API_BASE}/incidents/${incidentId}/events`).then(r => r.json());
    const fetchTerminal = fetch(`${API_BASE}/incidents/${incidentId}/terminal`).then(r => r.json());

    Promise.all([fetchLogs, fetchMetrics, fetchEvents, fetchTerminal])
      .then(([logsData, metricsData, eventsData, terminalData]) => {
        setLogs(Array.isArray(logsData) ? logsData : []);
        setMetrics(Array.isArray(metricsData) ? metricsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setTerminalResponses(
          Array.isArray(terminalData)
            ? terminalData.reduce((acc, row) => {
                acc[row.command] = row.output;
                return acc;
              }, {})
            : {}
        );
      })
      .catch(() => {
        setLogs([]);
        setMetrics([]);
        setEvents([]);
        setTerminalResponses({});
      });
  }, [incident?.rawId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setShowIncidentModal(false);
        setShowAbandonModal(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleTabClick(id) {
    setActiveTab(id);
    setTabVisits(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function handleRCASubmit(rca) {
    sessionStorage.setItem('rca', JSON.stringify(rca));
    sessionStorage.setItem('elapsed', elapsed.toString());
    sessionStorage.setItem('tabVisits', JSON.stringify(tabVisits));
    // Clear draft after submit
    sessionStorage.removeItem('iz_rca_what');
    sessionStorage.removeItem('iz_rca_root');
    sessionStorage.removeItem('iz_rca_fix');
    sessionStorage.removeItem('iz_notes');
    navigate('/report');
  }

  function handleAbandon() {
    sessionStorage.removeItem('iz_rca_what');
    sessionStorage.removeItem('iz_rca_root');
    sessionStorage.removeItem('iz_rca_fix');
    sessionStorage.removeItem('iz_notes');
    sessionStorage.removeItem('incidentStart');
    navigate('/');
  }

  const incidentMeta = incident
    ? {
        ...incident,
        severityLabel: incident.severityLabel || (incident.severity ? incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) : 'Critical'),
      }
    : null;

  return (
    <div className={styles.workspace}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.abandonBtn}
            onClick={() => setShowAbandonModal(true)}
            title="Abandon investigation"
          >
            ← Home
          </button>
        </div>

        <div className={styles.incidentTag}>
          <span className={styles.incidentFlash}>🔴</span>
          <span className={styles.incidentId}>{incidentMeta?.id || '—'}</span>
          <span className={styles.incidentSep}>·</span>
          <span className={styles.incidentTitle}>{incidentMeta?.title || 'Loading incident…'}</span>
        </div>

        <div className={styles.topbarRight}>
          <div className={styles.timer}>
            <span className={styles.timerIcon}>⏱</span>
            <span className={styles.timerValue}>{formatTime(elapsed)}</span>
          </div>
          <span className={styles.severity}>{incidentMeta?.severity || 'P1'} · {incidentMeta?.severityLabel || 'Critical'}</span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionLabel}>INVESTIGATION</div>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.sidebarItem} ${activeTab === tab.id ? styles.sidebarActive : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className={styles.sidebarIcon}>{tab.icon}</span>
                <span className={styles.sidebarLabel}>{tab.label}</span>
                {tab.id === 'rca' && (whatHappened || rootCause || howFix) && (
                  <span className={styles.draftDot} title="Draft saved" />
                )}
                {tab.id !== 'rca' && tabVisits[tab.id] && (
                  <span className={styles.visitBadge}>{tabVisits[tab.id]}</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.sidebarBottom}>
            <button
              className={styles.incidentSummary}
              onClick={() => setShowIncidentModal(true)}
              title="Click to view full incident details"
            >
              <div className={styles.summaryTopRow}>
                <div className={styles.summaryTitle}>Active Incident</div>
                <span className={styles.summaryViewBtn}>View ↗</span>
              </div>
              <div className={styles.summaryService}>{incidentMeta?.service || '—'}</div>
              <div className={styles.summaryDesc}>Latency: 80ms → 1.2s</div>
              <div className={styles.summaryTime}>Started {incidentMeta?.startTime || '—'}</div>
            </button>
          </div>
        </aside>

        {/* Main panel */}
        <main className={styles.main}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              {TABS.find(t => t.id === activeTab)?.icon}{' '}
              {TABS.find(t => t.id === activeTab)?.label}
            </div>
            {activeTab === 'metrics' && (
              <span className={styles.panelMeta}>Last updated · live simulation</span>
            )}
            {activeTab === 'logs' && (
              <span className={styles.panelMeta}>Showing {logs.length} log entries across all services</span>
            )}
            {activeTab === 'events' && (
              <span className={styles.panelMeta}>{events.length} Kubernetes cluster events</span>
            )}
            {activeTab === 'terminal' && (
              <span className={styles.panelMeta}>kubectl · production namespace</span>
            )}
          </div>

          <div className={styles.panelBody}>
            {activeTab === 'metrics'  && <MetricsPanel metrics={metrics} />}
            {activeTab === 'logs'     && <LogsPanel logs={logs} />}
            {activeTab === 'events'   && <EventsPanel events={events} />}
            {activeTab === 'terminal' && <TerminalPanel terminalResponses={terminalResponses} />}
            {activeTab === 'notes'    && <NotesPanel notes={notes} setNotes={setNotes} />}
            {activeTab === 'rca'      && <RCAPanel
              whatHappened={whatHappened}
              setWhatHappened={setWhatHappened}
              rootCause={rootCause}
              setRootCause={setRootCause}
              howFix={howFix}
              setHowFix={setHowFix}
              onSubmit={handleRCASubmit}
            />}
          </div>
        </main>
      </div>

      {/* ── Incident Details Modal ── */}
      {showIncidentModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowIncidentModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <span className={styles.modalFlash}>🔴</span>
                <div>
                  <div className={styles.modalSource}>PagerDuty · {incidentMeta?.date || 'Loading…'} · {incidentMeta?.startTime || '—'}</div>
                  <div className={styles.modalTitle}>{incidentMeta?.title || 'Loading incident…'}</div>
                </div>
              </div>
              <div className={styles.modalHeaderRight}>
                <span className={styles.modalSeverity}>P1 · Critical</span>
                <button className={styles.modalClose} onClick={() => setShowIncidentModal(false)}>✕</button>
              </div>
            </div>

            {/* Modal body */}
            <div className={styles.modalBody}>

              <div className={styles.modalSection}>
                <div className={styles.modalSectionLabel}>Incident Description</div>
                <p className={styles.modalDescription}>{incidentMeta?.description || 'Waiting for the backend to provide detail.'}</p>
              </div>

              <div className={styles.modalMeta}>
                <div className={styles.modalMetaItem}>
                  <span className={styles.modalMetaKey}>Incident ID</span>
                  <span className={`${styles.modalMetaVal} ${styles.modalCode}`}>{incidentMeta?.id || '—'}</span>
                </div>
                <div className={styles.modalMetaItem}>
                  <span className={styles.modalMetaKey}>Severity</span>
                  <span className={styles.modalMetaValRed}>{incidentMeta?.severityLabel || 'Critical'}</span>
                </div>
                <div className={styles.modalMetaItem}>
                  <span className={styles.modalMetaKey}>Affected Service</span>
                  <span className={`${styles.modalMetaVal} ${styles.modalCode}`}>{incidentMeta?.service || '—'}</span>
                </div>
                <div className={styles.modalMetaItem}>
                  <span className={styles.modalMetaKey}>Team</span>
                  <span className={styles.modalMetaVal}>{incidentMeta?.team || '—'}</span>
                </div>
                <div className={`${styles.modalMetaItem} ${styles.modalMetaFull}`}>
                  <span className={styles.modalMetaKey}>SLO Breached</span>
                  <span className={styles.modalMetaValRed}>{incidentMeta?.slo || '—'}</span>
                </div>
              </div>

              <div className={styles.modalImpact}>
                <span className={styles.modalImpactIcon}>⚠️</span>
                <div>
                  <div className={styles.modalImpactLabel}>Customer Impact</div>
                  <div className={styles.modalImpactText}>{incidentMeta?.customerImpact || '—'}</div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <div className={styles.modalSectionLabel}>Affected Services</div>
                <div className={styles.modalServices}>
                  {(incidentMeta?.affectedServices || []).map(s => (
                    <span key={s} className={styles.modalServiceBadge}>{s}</span>
                  ))}
                </div>
              </div>

            </div>

            <div className={styles.modalFooter}>
              <span className={styles.modalFooterNote}>
                Press <kbd className={styles.kbd}>Esc</kbd> or click outside to close
              </span>
              <button className={styles.modalCloseBtn} onClick={() => setShowIncidentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Abandon Investigation Modal ── */}
      {showAbandonModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAbandonModal(false)}>
          <div className={styles.abandonModal} onClick={e => e.stopPropagation()}>
            <div className={styles.abandonModalIcon}>⚠️</div>
            <h2 className={styles.abandonModalTitle}>Abandon Investigation?</h2>
            <p className={styles.abandonModalDesc}>
              You've been investigating for <strong>{formatTime(elapsed)}</strong>.
              Leaving now will discard your progress, notes, and any unsaved RCA draft.
            </p>
            <p className={styles.abandonModalSub}>
              The incident will still be here when you come back.
            </p>
            <div className={styles.abandonModalActions}>
              <button className={styles.abandonModalStay} onClick={() => setShowAbandonModal(false)}>
                Keep Investigating
              </button>
              <button className={styles.abandonModalLeave} onClick={handleAbandon}>
                Abandon &amp; Go Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
