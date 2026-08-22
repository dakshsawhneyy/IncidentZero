import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Report.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

/* ─────────────────────────────────────────────────────────────
   Scoring — driven entirely by the DB root-cause record.

   The investigationPath from the DB looks like:
     "Check Metrics (Redis latency is the leading indicator)"
     "Check Events (MemoryPressure on redis-cache)"
     "Check Logs (circuit breaker open, i/o timeout)"
     "Check Terminal (kubectl top pods, kubectl describe redis-cache-0)"

   We extract the tool name from each path step and match against
   what the user actually visited (tabVisits keys).

   RCA scoring uses keyClues from the DB to build a keyword map
   dynamically — no more hardcoded strings divorced from the data.
───────────────────────────────────────────────────────────── */

/* Extract the tool id from a path string like "Check Metrics (…)" */
function pathToTabId(pathStr) {
  const lower = (pathStr || '').toLowerCase();
  if (lower.includes('metric'))   return 'metrics';
  if (lower.includes('event'))    return 'events';
  if (lower.includes('log'))      return 'logs';
  if (lower.includes('terminal')) return 'terminal';
  if (lower.includes('notes'))    return 'notes';
  return null;
}

/*
  Build scoring rubric from DB keyClues.

  Each clue maps to one or more keywords that a good RCA would contain.
  Points are distributed so max possible = 80 (leaving 20 for investigation breadth).
*/
function buildRubricFromClues(keyClues) {
  if (!Array.isArray(keyClues) || keyClues.length === 0) {
    // fallback generic rubric
    return [
      { terms: ['redis', 'cache'],                              points: 25, hint: 'Identified the affected component' },
      { terms: ['memory', 'oom', 'maxmemory', 'evict'],        points: 20, hint: 'Identified the root cause mechanism' },
      { terms: ['circuit breaker', 'circuit', 'fallback'],     points: 15, hint: 'Mentioned cascading failure behavior' },
      { terms: ['connection', 'pool', 'timeout'],               points: 10, hint: 'Recognized connection exhaustion' },
      { terms: ['cascade', 'cascading', 'dependency'],         points: 10, hint: 'Understood the cascading pattern' },
    ];
  }

  // Build term groups from clue text — split into individual keywords
  const clueKeywords = keyClues.map(clue => {
    const lower = clue.toLowerCase();
    const terms = [];
    // Extract quoted or parenthesised key phrases
    // Redis signals
    if (lower.includes('redis'))                       terms.push('redis', 'cache');
    if (lower.includes('memory') || lower.includes('oom')) terms.push('memory', 'oom', 'maxmemory', 'evict');
    if (lower.includes('circuit'))                     terms.push('circuit breaker', 'circuit', 'fallback');
    if (lower.includes('connection') || lower.includes('pool')) terms.push('connection', 'pool', 'maxclients', 'timeout');
    if (lower.includes('cascade') || lower.includes('latency')) terms.push('cascade', 'cascading', 'dependency', 'upstream', 'latency');
    if (lower.includes('kubectl') || lower.includes('top pods')) terms.push('kubectl', 'top pods', 'describe');
    return terms.filter(t => t.length);
  }).filter(t => t.length);

  // Deduplicate and assign points proportionally across up to 5 groups
  const seen = new Set();
  const groups = [];
  for (const terms of clueKeywords) {
    const key = terms[0];
    if (!seen.has(key)) {
      seen.add(key);
      groups.push(terms);
    }
    if (groups.length >= 5) break;
  }

  const total = 80;
  const perGroup = Math.floor(total / groups.length);
  return groups.map((terms, i) => ({
    terms,
    points: i < groups.length - 1 ? perGroup : total - perGroup * (groups.length - 1),
    hint: `Mentioned a key contributing factor (+${i < groups.length - 1 ? perGroup : total - perGroup * (groups.length - 1)})`,
  }));
}

function scoreRCA(rcaText, keyClues) {
  const text = (rcaText || '').toLowerCase();
  let score = 0;
  const hits = [];
  const misses = [];

  const rubric = buildRubricFromClues(keyClues);

  for (const kt of rubric) {
    if (kt.terms.some(t => text.includes(t))) {
      score += kt.points;
      hits.push({ type: 'positive', text: kt.hint });
    } else {
      misses.push({ type: 'negative', text: `Missed: ${kt.hint.replace('Mentioned a key contributing factor', 'a key factor was not mentioned')}` });
    }
  }

  // Contextual penalty — jumping to fixes before diagnosing
  const jumpedToFix = (
    (text.includes('restart') && !text.includes('after') && !text.includes('because')) ||
    text.includes('redeploy') ||
    text.includes('rollback')
  );
  if (jumpedToFix) {
    score = Math.max(0, score - 10);
    hits.push({ type: 'negative', text: 'Jumped to a fix before fully explaining the cause (−10)' });
  }

  return { score: Math.min(80, score), hits, misses };
}

/*
  Investigation breadth — scored against the actual investigationPath from DB.
  Each path step that the user visited earns equal points, max 20 pts total.
*/
function scoreInvestigation(tabVisits, investigationPath) {
  const hints = [];

  const steps = Array.isArray(investigationPath) ? investigationPath : [];
  const relevantIds = [...new Set(steps.map(pathToTabId).filter(Boolean))];

  const visited   = relevantIds.filter(id => tabVisits[id]);
  const unvisited = relevantIds.filter(id => !tabVisits[id]);

  const pointsEach = relevantIds.length > 0 ? Math.floor(20 / relevantIds.length) : 5;
  const bonus = visited.length * pointsEach;

  for (const id of visited) {
    const step = steps.find(s => pathToTabId(s) === id);
    hints.push({ type: 'positive', text: `Checked ${capitalize(id)} — ${trimParens(step || id)}` });
  }
  for (const id of unvisited) {
    const step = steps.find(s => pathToTabId(s) === id);
    hints.push({ type: 'negative', text: `Skipped ${capitalize(id)} — ${trimParens(step || id)}` });
  }

  return { bonus, hints };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function trimParens(s) {
  // "Check Metrics (Redis latency…)" → "Redis latency…"
  const m = s.match(/\((.+)\)/);
  return m ? m[1] : s;
}

function getGrade(score) {
  if (score >= 90) return { label: 'Outstanding',    color: 'var(--green-soft)', bar: 'var(--green)' };
  if (score >= 75) return { label: 'Strong',         color: 'var(--blue-soft)',  bar: 'var(--blue)' };
  if (score >= 55) return { label: 'Developing',     color: 'var(--yellow)',     bar: 'var(--yellow)' };
  return               { label: 'Keep Practicing', color: 'var(--red-soft)',   bar: 'var(--red)' };
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s < 10 ? '0' + s : s}s`;
}

/* ── Logo ── */
function Logo({ onClick }) {
  return (
    <button className={styles.logo} onClick={onClick}>
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

/* ═══════════════════════════════════════
   Main component
═══════════════════════════════════════ */
export default function Report() {
  const navigate = useNavigate();
  const [rca,             setRca]             = useState(null);
  const [elapsed,         setElapsed]         = useState(0);
  const [tabVisits,       setTabVisits]       = useState({});
  const [animScore,       setAnimScore]       = useState(0);
  const [revealed,        setRevealed]        = useState(false);
  const [incident,        setIncident]        = useState(null);
  const [rootCauseAnswer, setRootCauseAnswer] = useState(null);

  useEffect(() => {
    try {
      const r = JSON.parse(sessionStorage.getItem('rca')       || 'null');
      const e = parseInt(sessionStorage.getItem('elapsed')     || '0', 10);
      const t = JSON.parse(sessionStorage.getItem('tabVisits') || '{}');
      setRca(r);
      setElapsed(e);
      setTabVisits(t);
    } catch (_) {}

    const storedId = Number(sessionStorage.getItem('selectedIncidentId'));
    fetch(`${API_BASE}/incidents`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const chosen = data.find(i => i.rawId === storedId) || data[0];
          setIncident(chosen);
        }
      })
      .catch(() => {});

    setTimeout(() => setRevealed(true), 220);
  }, []);

  useEffect(() => {
    if (!incident?.rawId) return;
    fetch(`${API_BASE}/incidents/${incident.rawId}/root-cause`)
      .then(r => r.json())
      .then(data => { if (data?.primaryCause) setRootCauseAnswer(data); })
      .catch(() => {});
  }, [incident?.rawId]);

  /* ── Scoring — wait for DB data ── */
  const keyClues         = rootCauseAnswer?.keyClues         || [];
  const investigationPath = rootCauseAnswer?.investigationPath || [];

  const rcaResult  = rca ? scoreRCA(rca.rootCause + ' ' + (rca.whatHappened || ''), keyClues) : { score: 0, hits: [], misses: [] };
  const invResult  = scoreInvestigation(tabVisits, investigationPath);
  const finalScore = Math.min(100, rcaResult.score + invResult.bonus);
  const grade      = getGrade(finalScore);

  // All score feedback lines merged + sorted (positives first)
  const allFeedback = [
    ...rcaResult.hits,
    ...invResult.hints,
    ...rcaResult.misses,
  ];

  useEffect(() => {
    if (!revealed || finalScore === 0) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(finalScore / 50));
    const iv = setInterval(() => {
      current = Math.min(current + step, finalScore);
      setAnimScore(current);
      if (current >= finalScore) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [revealed, finalScore]);

  /* path done — match tab id extracted from path string */
  function isPathDone(pathStr) {
    const id = pathToTabId(pathStr);
    return id ? !!tabVisits[id] : false;
  }

  return (
    <div className={styles.page}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <Logo onClick={() => navigate('/')} />
        <span className={styles.topbarTitle}>Post-Incident Report</span>
        <span className={styles.topbarIncident}>{incident?.id || '—'}</span>
      </header>

      <div className={`${styles.main} ${revealed ? styles.visible : ''}`}>

        {/* ── Score hero ── */}
        <div className={styles.hero}>
          {/* Big score */}
          <div className={styles.heroScore}>
            <div className={styles.heroScoreLabel}>Investigation Score</div>
            <div className={styles.heroScoreValue} style={{ color: grade.color }}>
              {animScore}
              <span className={styles.heroScoreMax}>/100</span>
            </div>
            <div className={styles.heroGradeBadge} style={{ color: grade.color, borderColor: grade.color, background: `${grade.bar}14` }}>
              {grade.label}
            </div>
          </div>

          {/* Score bar */}
          <div className={styles.heroBarWrap}>
            <div className={styles.heroBar}>
              <div
                className={styles.heroBarFill}
                style={{
                  width: `${animScore}%`,
                  background: `linear-gradient(90deg, ${grade.bar}, ${grade.color})`,
                }}
              />
            </div>
            <div className={styles.heroBarLabels}>
              <span>0</span>
              <span style={{ color: 'var(--yellow)' }}>55</span>
              <span style={{ color: 'var(--blue-soft)' }}>75</span>
              <span style={{ color: 'var(--green-soft)' }}>90</span>
              <span>100</span>
            </div>
          </div>

          {/* Meta row */}
          <div className={styles.heroMeta}>
            <div className={styles.heroMetaItem}>
              <span className={styles.heroMetaLabel}>Time</span>
              <span className={styles.heroMetaValue}>{formatTime(elapsed)}</span>
            </div>
            <div className={styles.heroMetaDivider} />
            <div className={styles.heroMetaItem}>
              <span className={styles.heroMetaLabel}>Tools used</span>
              <span className={styles.heroMetaValue}>{Object.keys(tabVisits).length} / 5</span>
            </div>
            <div className={styles.heroMetaDivider} />
            <div className={styles.heroMetaItem}>
              <span className={styles.heroMetaLabel}>RCA quality</span>
              <span className={styles.heroMetaValue}>{rcaResult.score} / 80</span>
            </div>
            <div className={styles.heroMetaDivider} />
            <div className={styles.heroMetaItem}>
              <span className={styles.heroMetaLabel}>Breadth bonus</span>
              <span className={styles.heroMetaValue}>+{invResult.bonus}</span>
            </div>
          </div>
        </div>

        {/* ── Content grid ── */}
        <div className={styles.grid}>

          {/* Score breakdown */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardHeadIcon}>▦</span>
              Score breakdown
            </div>
            <div className={styles.feedbackList}>
              {allFeedback.length === 0 && (
                <p className={styles.emptyNote}>No RCA was submitted.</p>
              )}
              {allFeedback.map((f, i) => (
                <div key={i} className={`${styles.feedbackRow} ${f.type === 'positive' ? styles.feedPos : styles.feedNeg}`}>
                  <span className={styles.feedIcon}>{f.type === 'positive' ? '✓' : '✗'}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Your RCA */}
          {rca && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardHeadIcon}>✎</span>
                Your RCA
              </div>
              {rca.whatHappened && (
                <div className={styles.rcaBlock}>
                  <span className={styles.rcaBlockLabel}>What happened</span>
                  <p className={styles.rcaBlockText}>{rca.whatHappened}</p>
                </div>
              )}
              <div className={styles.rcaBlock}>
                <span className={styles.rcaBlockLabel}>Root cause</span>
                <p className={styles.rcaBlockText}>{rca.rootCause || '(not provided)'}</p>
              </div>
              {rca.howFix && (
                <div className={styles.rcaBlock}>
                  <span className={styles.rcaBlockLabel}>Fix / prevention</span>
                  <p className={styles.rcaBlockText}>{rca.howFix}</p>
                </div>
              )}
            </div>
          )}

          {/* Actual root cause */}
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <div className={styles.cardHead}>
              <span className={styles.cardHeadIcon}>◈</span>
              Actual root cause
            </div>
            {rootCauseAnswer ? (
              <>
                <div className={styles.rcaPrimary}>{rootCauseAnswer.primaryCause}</div>
                <p className={styles.rcaExplain}>{rootCauseAnswer.explanation}</p>
                <div className={styles.clueList}>
                  <span className={styles.clueListLabel}>Key clues</span>
                  {rootCauseAnswer.keyClues.map((c, i) => (
                    <div key={i} className={styles.clueRow}>
                      <span className={styles.clueNum}>{i + 1}</span>
                      <span className={styles.clueText}>{c}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.loadingNote}>Loading…</p>
            )}
          </div>

          {/* Investigation path */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardHeadIcon}>→</span>
              Ideal investigation path
            </div>
            <div className={styles.pathList}>
              {(rootCauseAnswer?.investigationPath || []).map((p, i) => {
                const done = isPathDone(p);
                return (
                  <div key={i} className={`${styles.pathRow} ${done ? styles.pathDone : styles.pathMissed}`}>
                    <span className={styles.pathNum}>{i + 1}</span>
                    <span className={styles.pathText}>{p}</span>
                    <span className={styles.pathStatus}>{done ? '✓' : '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Common mistakes */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardHeadIcon}>!</span>
              Common mistakes
            </div>
            <div className={styles.mistakeList}>
              {(rootCauseAnswer?.commonMistakes || []).map((m, i) => (
                <div key={i} className={styles.mistakeRow}>
                  <span className={styles.mistakeIcon}>!</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson — full width */}
          <div className={`${styles.card} ${styles.cardLesson}`}>
            <div className={styles.cardHead}>
              <span className={styles.cardHeadIcon}>◆</span>
              The lesson
            </div>
            <p className={styles.lessonText}>
              When API latency spikes, always check <strong>dependencies first</strong>.
              The issue is rarely in the service that's visibly failing — it's in what that
              service depends on. In this case, Redis memory exhaustion was the root cause,
              not a bug in checkout-api.
            </p>
            <p className={styles.lessonText}>
              The investigation principle: <strong>follow the latency, not the errors</strong>.
              Redis latency spiked from 2ms to 340ms several seconds before errors appeared.
              That was the earliest signal.
            </p>
          </div>

        </div>

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/investigate')}>
            Re-investigate
          </button>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}
