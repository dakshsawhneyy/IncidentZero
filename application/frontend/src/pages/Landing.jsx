import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

/* ── Typewriter hook ── */
function useTypewriter(lines, speed = 28) {
  const [displayed, setDisplayed] = useState([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lineIdx >= lines.length) { setDone(true); return; }
    const line = lines[lineIdx];
    if (charIdx <= line.text.length) {
      const t = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev];
          next[lineIdx] = { ...line, text: line.text.slice(0, charIdx) };
          return next;
        });
        setCharIdx(c => c + 1);
      }, line.delay && charIdx === 0 ? line.delay : speed);
      return () => clearTimeout(t);
    } else {
      setLineIdx(l => l + 1);
      setCharIdx(0);
    }
  }, [lineIdx, charIdx, lines, speed]);

  return { displayed, done };
}

/* ── Boot sequence lines ── */
const BOOT_LINES = [
  { text: 'incident-zero v0.1.0 — production simulation engine', type: 'system', delay: 0 },
  { text: 'loading incident database...', type: 'system', delay: 120 },
  { text: '[  OK  ] incidents loaded: 1 active', type: 'ok', delay: 80 },
  { text: '[  OK  ] simulation engine ready', type: 'ok', delay: 60 },
  { text: '──────────────────────────────────────────────────', type: 'sep', delay: 40 },
  { text: '  INCOMING ALERT  ──  07:13:01 UTC', type: 'alert', delay: 300 },
  { text: '', type: 'blank', delay: 0 },
  { text: '  SOURCE   PagerDuty', type: 'data', delay: 30 },
  { text: '  SERVICE  checkout-api  [production]', type: 'data', delay: 30 },
  { text: '  SEVERITY P1 · Critical', type: 'critical', delay: 30 },
  { text: '  SLO      P99 latency 1247ms  (SLO: 200ms)  ❌ BREACHED', type: 'critical', delay: 30 },
  { text: '  IMPACT   ~2,400 failed checkouts in last 15min', type: 'warn', delay: 30 },
  { text: '', type: 'blank', delay: 0 },
  { text: '──────────────────────────────────────────────────', type: 'sep', delay: 40 },
  { text: 'You are On-Call. Respond now.', type: 'prompt', delay: 400 },
];

/* ── Terminal block used below hero ── */
const KUBECTL_OUTPUT = `$ kubectl top pods -n production
NAME                         CPU(cores)   MEMORY(bytes)
checkout-api-7d9f8c-xk2pl    42m          180Mi
redis-cache-0                180m         7680Mi   ← 7.68GB / 8GB
payment-api-6b8d4f-hj3kp     28m          145Mi
postgres-0                   35m          512Mi`;

const LOG_OUTPUT = `$ kubectl logs checkout-api-7d9f8c-xk2pl --tail=5
07:12:58 WARN  Redis connection slow — latency 340ms
07:13:01 ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
07:13:03 WARN  Circuit breaker OPEN for redis-cache
07:13:13 ERROR All retries exhausted. Request failed.
07:13:24 WARN  Error rate 18.3% over last 60s`;

/* ── Static code block ── */
function CodeBlock({ label, content, color = 'var(--green)' }) {
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeBlockDot} style={{ background: '#ff5f56' }} />
        <span className={styles.codeBlockDot} style={{ background: '#ffbd2e' }} />
        <span className={styles.codeBlockDot} style={{ background: '#27c93f' }} />
        <span className={styles.codeBlockLabel}>{label}</span>
      </div>
      <pre className={styles.codeBlockBody} style={{ color }}>{content}</pre>
    </div>
  );
}

/* ── Main Component ── */
export default function Landing() {
  const navigate = useNavigate();
  const [bootDone, setBootDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const termRef = useRef(null);

  const { displayed, done } = useTypewriter(BOOT_LINES, 22);

  useEffect(() => {
    if (done) setBootDone(true);
  }, [done]);

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [displayed]);

  return (
    <div className={styles.page}>

      {/* ── Topbar ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoMark}>▶</span>
          <span className={styles.navLogoText}>incident<span className={styles.navLogoAccent}>zero</span></span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.navStatus}>
            <span className={styles.navStatusDot} />
            1 active incident
          </span>
          <span className={styles.navBeta}>v0.1 BETA</span>
        </div>
      </nav>

      {/* ── Hero: Boot Terminal ── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          {/* Terminal window */}
          <div className={styles.termWindow}>
            <div className={styles.termBar}>
              <div className={styles.termDots}>
                <span className={styles.termDot} style={{ background: '#ff5f56' }} />
                <span className={styles.termDot} style={{ background: '#ffbd2e' }} />
                <span className={styles.termDot} style={{ background: '#27c93f' }} />
              </div>
              <span className={styles.termTitle}>incident-zero — zsh</span>
              <span />
            </div>
            <div className={styles.termBody} ref={termRef}>
              {displayed.map((line, i) => (
                <div key={i} className={`${styles.termLine} ${styles[`type_${line.type}`]}`}>
                  {line.text}
                </div>
              ))}
              {!done && (
                <span className={`${styles.termCursor} ${showCursor ? styles.cursorOn : styles.cursorOff}`}>█</span>
              )}
              {bootDone && (
                <div className={styles.termPromptLine}>
                  <span className={styles.termPs}>oncall@prod:~$</span>
                  <span className={styles.termInput}> _</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            SRE SIMULATION PLATFORM
          </div>
          <h1 className={styles.heroTitle}>
            The place between<br />
            <span className={styles.heroTitleAccent}>learning tools</span><br />
            and surviving production.
          </h1>
          <p className={styles.heroDesc}>
            You've done the labs. You know kubectl.<br />
            But when the pager fires at 3 AM —<br />
            what do you check first?
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnRespond} onClick={() => navigate('/incident')}>
              <span className={styles.btnRespondDot} />
              respond to incident #001
            </button>
            <div className={styles.heroBtnMeta}>no signup · ~15 min · P1 severity</div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className={styles.sectionDivider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerLabel}>// investigation preview</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ── Investigation Preview ── */}
      <section className={styles.preview}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTag}>WHAT YOU'LL ACTUALLY DO</span>
          <h2 className={styles.previewTitle}>No walkthroughs. No hints.<br />Just signals and a timer.</h2>
        </div>
        <div className={styles.previewTerminals}>
          <CodeBlock label="kubectl top pods" content={KUBECTL_OUTPUT} color="var(--text-green)" />
          <CodeBlock label="kubectl logs checkout-api" content={LOG_OUTPUT} color="var(--text-code)" />
        </div>
        <p className={styles.previewNote}>
          ↑ This is what you see. What you do next is up to you.
        </p>
      </section>

      {/* ── Divider ── */}
      <div className={styles.sectionDivider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerLabel}>// vs other platforms</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ── Comparison ── */}
      <section className={styles.compare}>
        <div className={styles.compareGrid}>
          {[
            { lab: 'Deploy nginx to K8s',         us: 'nginx is down. find out why.' },
            { lab: 'Learn kubectl commands',       us: 'P1 is firing. which command first?' },
            { lab: 'Configure Prometheus alerts',  us: 'alert fired. what does it mean?' },
            { lab: 'Complete a guided exercise',   us: 'no instructions. just evidence.' },
          ].map((row, i) => (
            <div key={i} className={styles.compareRow}>
              <div className={styles.compareLab}>
                <span className={styles.compareIcon}>✗</span>
                <span>{row.lab}</span>
              </div>
              <div className={styles.compareArrow}>→</div>
              <div className={styles.compareUs}>
                <span className={styles.compareIconGreen}>✓</span>
                <span>{row.us}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.compareCaption}>
          Other platforms teach you how to configure systems.
          We teach you how to save them.
        </div>
      </section>

      {/* ── Divider ── */}
      <div className={styles.sectionDivider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerLabel}>// scoring</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ── Scoring preview ── */}
      <section className={styles.scoring}>
        <div className={styles.scoringLeft}>
          <span className={styles.scoringTag}>AFTER EVERY INCIDENT</span>
          <h2 className={styles.scoringTitle}>Your investigation<br />gets graded.</h2>
          <p className={styles.scoringDesc}>
            Not just whether you found the root cause.
            How you investigated — what you checked, what you missed,
            and whether your thinking matches how a senior SRE approaches it.
          </p>
        </div>
        <div className={styles.scoringRight}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreCardHeader}>
              <span className={styles.scoreCardId}>INC-001 · POST-INCIDENT</span>
              <span className={styles.scoreCardScore}>72<span className={styles.scoreCardMax}>/100</span></span>
            </div>
            <div className={styles.scoreCardLines}>
              {[
                { ok: true,  t: 'Identified Redis as root dependency' },
                { ok: true,  t: 'Checked kubectl top pods' },
                { ok: false, t: 'Never opened Kubernetes Events' },
                { ok: false, t: 'Restarted pod before finding cause' },
              ].map((l, i) => (
                <div key={i} className={`${styles.scoreLine} ${l.ok ? styles.scoreOk : styles.scoreFail}`}>
                  <span className={styles.scoreLineMark}>{l.ok ? '✓' : '✗'}</span>
                  <span>{l.t}</span>
                </div>
              ))}
            </div>
            <div className={styles.scoreCardLesson}>
              <span className={styles.scoreLessonLabel}>LESSON</span>
              Redis latency spiked before the circuit breaker opened.
              Check dependency metrics first.
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaTerminal}>
          <span className={styles.ctaPs}>oncall@prod:~$</span>
          <span className={styles.ctaCmd}> respond --incident INC-001 --severity P1</span>
        </div>
        <p className={styles.ctaNote}>one incident. no hints. just you and the signals.</p>
        <button className={styles.btnRespond} onClick={() => navigate('/incident')}>
          <span className={styles.btnRespondDot} />
          start investigation
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerLeft}>incident-zero · v0.1.0</span>
        <span className={styles.footerMid}>built for engineers who think under pressure</span>
        <span className={styles.footerRight}>© 2026</span>
      </footer>
    </div>
  );
}
