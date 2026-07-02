import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rootCauseAnswer } from '../data/incident001';
import styles from './Report.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function scoreRCA(rcaText) {
  const text = (rcaText || '').toLowerCase();
  let score = 0;
  const hints = [];

  const keyTerms = [
    { terms: ['redis', 'cache'], points: 25, hint: 'Correctly identified Redis as the affected component (+25)' },
    { terms: ['memory', 'oom', 'maxmemory', 'evict'], points: 20, hint: 'Identified memory exhaustion as the cause (+20)' },
    { terms: ['circuit breaker', 'circuit', 'fallback'], points: 15, hint: 'Mentioned the circuit breaker behavior (+15)' },
    { terms: ['connection', 'pool', 'maxclients', 'timeout'], points: 10, hint: 'Recognized connection exhaustion (+10)' },
    { terms: ['cascade', 'cascading', 'dependency', 'upstream'], points: 10, hint: 'Understood the cascading failure pattern (+10)' },
  ];

  for (const kt of keyTerms) {
    if (kt.terms.some(t => text.includes(t))) {
      score += kt.points;
      hints.push({ type: 'positive', text: kt.hint });
    }
  }

  // Penalty for restart-first thinking
  if (text.includes('restart') || text.includes('redeploy') || text.includes('rollback')) {
    score = Math.max(0, score - 10);
    hints.push({ type: 'negative', text: 'Mentioned restarting without root cause investigation (-10)' });
  }

  return { score: Math.min(100, score), hints };
}

function scoreTabVisits(tabVisits) {
  const hints = [];
  let bonus = 0;

  if (tabVisits.metrics) {
    bonus += 5;
    hints.push({ type: 'positive', text: 'Checked Metrics (leading indicators are key)' });
  }
  if (tabVisits.events) {
    bonus += 5;
    hints.push({ type: 'positive', text: 'Checked Kubernetes Events (often missed by juniors)' });
  }
  if (tabVisits.terminal) {
    bonus += 5;
    hints.push({ type: 'positive', text: 'Used the terminal (hands-on investigation)' });
  }
  if (!tabVisits.events) {
    hints.push({ type: 'negative', text: 'Never checked Kubernetes Events — critical clue missed' });
  }
  if (!tabVisits.metrics) {
    hints.push({ type: 'negative', text: 'Never looked at Metrics — Redis latency was the earliest signal' });
  }

  return { bonus, hints };
}

export default function Report() {
  const navigate = useNavigate();
  const [rca, setRca] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [tabVisits, setTabVisits] = useState({});
  const [animScore, setAnimScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    try {
      const r = JSON.parse(sessionStorage.getItem('rca') || 'null');
      const e = parseInt(sessionStorage.getItem('elapsed') || '0', 10);
      const t = JSON.parse(sessionStorage.getItem('tabVisits') || '{}');
      setRca(r);
      setElapsed(e);
      setTabVisits(t);
    } catch (_) {}

    fetch(`${API_BASE}/incidents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setIncident(data[0]);
        }
      })
      .catch(() => {});

    const timer = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const rcaScore = rca ? scoreRCA(rca.rootCause + ' ' + rca.whatHappened) : { score: 0, hints: [] };
  const tabScore = scoreTabVisits(tabVisits);
  const finalScore = Math.min(100, rcaScore.score + tabScore.bonus);

  useEffect(() => {
    if (!revealed) return;
    let current = 0;
    const step = Math.ceil(finalScore / 40);
    const interval = setInterval(() => {
      current = Math.min(current + step, finalScore);
      setAnimScore(current);
      if (current >= finalScore) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [revealed, finalScore]);

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }

  function getGrade(score) {
    if (score >= 90) return { label: 'Outstanding', color: 'var(--green)', emoji: '🏆' };
    if (score >= 75) return { label: 'Strong', color: 'var(--blue)', emoji: '⭐' };
    if (score >= 55) return { label: 'Developing', color: 'var(--yellow)', emoji: '📈' };
    return { label: 'Keep Practicing', color: 'var(--orange)', emoji: '🔧' };
  }

  const grade = getGrade(finalScore);
  const allHints = [...rcaScore.hints, ...tabScore.hints];

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span>⚡</span>
          <span>Incident<strong>Zero</strong></span>
        </div>
        <span className={styles.topbarTitle}>Post-Incident Analysis</span>
        <span className={styles.topbarMeta}>{incident?.id || 'INC-001'}</span>
      </div>

      <div className={`${styles.main} ${revealed ? styles.visible : ''}`}>
        {/* Score hero */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreLeft}>
            <div className={styles.scoreGrade} style={{ color: grade.color }}>
              {grade.emoji} {grade.label}
            </div>
            <div className={styles.scoreValue} style={{ color: grade.color }}>
              {animScore}
              <span className={styles.scoreMax}>/100</span>
            </div>
            <div className={styles.scoreLabel}>Investigation Score</div>
          </div>

          <div className={styles.scoreMeta}>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Time Taken</span>
              <span className={styles.metaVal}>{formatTime(elapsed)}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Tools Used</span>
              <span className={styles.metaVal}>{Object.keys(tabVisits).length} / 5</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>RCA Quality</span>
              <span className={styles.metaVal}>{rcaScore.score}/80 pts</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Investigation Breadth</span>
              <span className={styles.metaVal}>+{tabScore.bonus} pts</span>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Score breakdown */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>📋 Score Breakdown</div>
            <div className={styles.hintList}>
              {allHints.length === 0 && (
                <p className={styles.emptyHint}>No RCA submitted.</p>
              )}
              {allHints.map((h, i) => (
                <div key={i} className={`${styles.hintRow} ${h.type === 'positive' ? styles.hintPos : styles.hintNeg}`}>
                  <span className={styles.hintIcon}>{h.type === 'positive' ? '✓' : '✗'}</span>
                  <span>{h.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Your RCA */}
          {rca && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>📝 Your RCA</div>
              {rca.whatHappened && (
                <div className={styles.rcaSection}>
                  <div className={styles.rcaSectionLabel}>What Happened</div>
                  <p className={styles.rcaText}>{rca.whatHappened}</p>
                </div>
              )}
              <div className={styles.rcaSection}>
                <div className={styles.rcaSectionLabel}>Root Cause</div>
                <p className={styles.rcaText}>{rca.rootCause || '(not provided)'}</p>
              </div>
              {rca.howFix && (
                <div className={styles.rcaSection}>
                  <div className={styles.rcaSectionLabel}>Fix / Prevention</div>
                  <p className={styles.rcaText}>{rca.howFix}</p>
                </div>
              )}
            </div>
          )}

          {/* Actual root cause */}
          <div className={`${styles.card} ${styles.cardHighlight}`}>
            <div className={styles.cardHeader}>🎯 Actual Root Cause</div>
            <div className={styles.rootCausePrimary}>{rootCauseAnswer.primaryCause}</div>
            <p className={styles.rootCauseExplain}>{rootCauseAnswer.explanation}</p>

            <div className={styles.clueSection}>
              <div className={styles.clueTitle}>Key Clues to Find</div>
              <div className={styles.clueList}>
                {rootCauseAnswer.keyClues.map((c, i) => (
                  <div key={i} className={styles.clueRow}>
                    <span className={styles.clueNum}>{i + 1}</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ideal investigation path */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>🗺 Ideal Investigation Path</div>
            <div className={styles.pathList}>
              {rootCauseAnswer.investigationPath.map((p, i) => (
                <div key={i} className={styles.pathRow}>
                  <div className={styles.pathNum}>{i + 1}</div>
                  <div className={styles.pathText}>{p}</div>
                  {tabVisits[p.split(' ')[1]?.toLowerCase().replace(/[^a-z]/g, '') || ''] ? (
                    <span className={styles.pathDone}>✓ Done</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Common mistakes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>⚠️ Common Mistakes in This Incident</div>
            <div className={styles.mistakeList}>
              {rootCauseAnswer.commonMistakes.map((m, i) => (
                <div key={i} className={styles.mistakeRow}>
                  <span className={styles.mistakeIcon}>⚠</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson */}
          <div className={`${styles.card} ${styles.cardLesson}`}>
            <div className={styles.cardHeader}>🧠 The Lesson</div>
            <p className={styles.lessonText}>
              When API latency spikes, always check <strong>dependencies first</strong>. 
              The issue is rarely in the service that's visibly failing — it's in what that service depends on.
              In this case, Redis memory exhaustion was the root cause, not a bug in checkout-api.
            </p>
            <p className={styles.lessonText} style={{ marginTop: 12 }}>
              The investigation principle: <strong>follow the latency, not the errors</strong>.
              Redis latency spiked from 2ms to 340ms several seconds before errors appeared.
              That was the earliest signal.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/investigate')}>
            ↩ Re-investigate
          </button>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
