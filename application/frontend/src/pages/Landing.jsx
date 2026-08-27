import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

/* ── Logo — exported for reuse ── */
export function NavLogo({ onClick }) {
  return (
    <button className={styles.navLogo} onClick={onClick}>
      <span className={styles.navLogoMark} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <polygon points="2,1 13,7 2,13" fill="currentColor" />
        </svg>
      </span>
      <span className={styles.navLogoText}>
        incident<span className={styles.navLogoAccent}>zero</span>
      </span>
    </button>
  );
}

/* ── CSS-only live UI panels — no images needed ── */

const METRIC_PANELS = [
  { label: 'P99 Latency',  value: '1,247ms', sub: '↑ from 80ms',  status: 'crit', w: 88 },
  { label: 'Error Rate',   value: '18.3%',   sub: '↑ from 0.1%',  status: 'crit', w: 72 },
  { label: 'Redis Memory', value: '7.68 GB', sub: '96% of limit',  status: 'warn', w: 96 },
  { label: 'Request Rate', value: '2,841/s', sub: '↓ from 4,200',  status: 'warn', w: 58 },
  { label: 'CPU',          value: '42m',     sub: 'nominal',        status: 'ok',   w: 18 },
  { label: 'Pod Restarts', value: '0',       sub: 'healthy',        status: 'ok',   w: 2  },
];

const LOG_ROWS = [
  { t: '07:12:58', l: 'WARN',  svc: 'checkout', msg: 'Redis connection slow — 340ms',    cls: 'w' },
  { t: '07:13:01', l: 'ERROR', svc: 'checkout', msg: 'Redis i/o timeout',                 cls: 'e' },
  { t: '07:13:03', l: 'WARN',  svc: 'checkout', msg: 'Circuit breaker OPEN for redis',    cls: 'w' },
  { t: '07:13:13', l: 'ERROR', svc: 'checkout', msg: 'All retries exhausted',             cls: 'e' },
  { t: '07:13:24', l: 'ERROR', svc: 'checkout', msg: 'Error rate 18.3% over 60s',         cls: 'e' },
];

function PanelChrome({ title, badge, badgeStyle, children }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelBar}>
        <div className={styles.panelDots}>
          <span style={{ background: '#ff5f56' }} />
          <span style={{ background: '#ffbd2e' }} />
          <span style={{ background: '#27c93f' }} />
        </div>
        <span className={styles.panelTitle}>{title}</span>
        {badge && <span className={styles.panelBadge} style={badgeStyle}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function PlatformShowcase() {
  return (
    <div className={styles.showcase}>
      <div className={styles.showcaseGlow} />

      {/* ── Panel A: Metrics ── */}
      <div className={`${styles.showcaseSlot} ${styles.slotA}`}>
        <PanelChrome
          title="Metrics — production"
          badge="P1 · Critical"
          badgeStyle={{ color: 'var(--red-soft)', background: 'var(--red-dim)', borderColor: 'var(--red-border)' }}
        >
          <div className={styles.metricsGrid}>
            {METRIC_PANELS.map(m => (
              <div key={m.label} className={`${styles.metricTile} ${styles[`mt_${m.status}`]}`}>
                <div className={styles.metricTileBar} style={{ width: `${m.w}%` }} />
                <span className={styles.metricTileLabel}>{m.label}</span>
                <span className={styles.metricTileValue}>{m.value}</span>
                <span className={styles.metricTileSub}>{m.sub}</span>
              </div>
            ))}
          </div>
        </PanelChrome>
      </div>

      {/* ── Panel B: Logs ── */}
      <div className={`${styles.showcaseSlot} ${styles.slotB}`}>
        <PanelChrome
          title="Logs — all services"
          badge="5 errors"
          badgeStyle={{ color: 'var(--red-soft)', background: 'var(--red-dim)', borderColor: 'var(--red-border)' }}
        >
          <div className={styles.logTable}>
            <div className={styles.logFilters}>
              {['ALL','ERROR','WARN','INFO'].map((f, i) => (
                <span key={f} className={`${styles.logFilter} ${i === 0 ? styles.logFilterActive : ''}`}>{f}</span>
              ))}
              <span className={styles.logCount}>5 lines</span>
            </div>
            {LOG_ROWS.map((r, i) => (
              <div key={i} className={`${styles.logRow} ${r.cls === 'e' ? styles.logRowError : styles.logRowWarn}`}>
                <span className={styles.logTime}>{r.t}</span>
                <span className={styles.logLevel}>{r.l}</span>
                <span className={styles.logSvc}>{r.svc}</span>
                <span className={styles.logMsg}>{r.msg}</span>
              </div>
            ))}
          </div>
        </PanelChrome>
      </div>

      {/* ── Panel C: Post-incident report ── */}
      <div className={`${styles.showcaseSlot} ${styles.slotC}`}>
        <PanelChrome title="Post-incident Report" badge="INC-001" badgeStyle={{ color: 'var(--amber)', background: 'var(--amber-dim)', borderColor: 'var(--amber-border)' }}>
          <div className={styles.reportPreview}>
            <div className={styles.rpScoreRow}>
              <div className={styles.rpScore}>
                <span className={styles.rpScoreNum}>72</span>
                <span className={styles.rpScoreMax}>/100</span>
              </div>
              <div className={styles.rpGrade}>Developing</div>
            </div>
            <div className={styles.rpBar}>
              <div className={styles.rpBarFill} style={{ width: '72%' }} />
            </div>
            <div className={styles.rpItems}>
              {[
                { ok: true,  t: 'Identified Redis as root cause' },
                { ok: true,  t: 'Checked kubectl top pods' },
                { ok: false, t: 'Skipped Kubernetes Events' },
                { ok: false, t: 'Restarted before diagnosing' },
              ].map((it, i) => (
                <div key={i} className={`${styles.rpItem} ${it.ok ? styles.rpItemOk : styles.rpItemFail}`}>
                  <span>{it.ok ? '✓' : '✗'}</span>
                  <span>{it.t}</span>
                </div>
              ))}
            </div>
            <div className={styles.rpLesson}>
              <span className={styles.rpLessonTag}>LESSON</span>
              Check Redis latency first — it spikes before errors appear.
            </div>
          </div>
        </PanelChrome>
      </div>

    </div>
  );
}

function Divider({ label }) {
  return (
    <div className={styles.divider}>
      <span className={styles.dividerLine} />
      <span className={styles.dividerLabel}>// {label}</span>
      <span className={styles.dividerLine} />
    </div>
  );
}

const COMPARE = [
  { them: 'Deploy nginx to K8s',         us: 'nginx is down — find out why.' },
  { them: 'Learn kubectl commands',       us: 'P1 is firing — which command first?' },
  { them: 'Configure Prometheus alerts',  us: 'Alert fired — what does it mean?' },
  { them: 'Complete a guided exercise',   us: 'No instructions. Just evidence.' },
];

/* ── Investigation Timeline — replaces the two plain terminals ── */

const TIMELINE_STEPS = [
  {
    step: 1,
    tool: 'Metrics',
    toolColor: 'var(--red-soft)',
    toolBg: 'var(--red-dim)',
    toolBorder: 'var(--red-border)',
    icon: '📊',
    cmd: 'kubectl top pods -n production',
    thought: 'P1 firing. Check resource pressure first.',
    findings: [
      { text: 'redis-cache-0',      detail: '7680Mi / 8192Mi',  status: 'crit', tag: '96% MEM' },
      { text: 'checkout-api',       detail: 'P99: 1,247ms',     status: 'crit', tag: 'LATENCY' },
      { text: 'payment-api',        detail: '145Mi  nominal',   status: 'ok',   tag: 'OK' },
    ],
    insight: 'Redis is near OOM. That\'s the blast radius.',
  },
  {
    step: 2,
    tool: 'Logs',
    toolColor: 'var(--blue-soft)',
    toolBg: 'var(--blue-dim)',
    toolBorder: 'var(--blue-border)',
    icon: '📋',
    cmd: 'kubectl logs checkout-api-7d9f8c-xk2pl --tail=20',
    thought: 'Confirm Redis is causing the checkout failures.',
    findings: [
      { text: '07:13:01 ERROR', detail: 'Redis i/o timeout',          status: 'crit', tag: 'TIMEOUT' },
      { text: '07:13:03 WARN',  detail: 'Circuit breaker OPEN',       status: 'warn', tag: 'CB OPEN' },
      { text: '07:13:13 ERROR', detail: 'All retries exhausted',      status: 'crit', tag: 'FATAL' },
    ],
    insight: 'Circuit breaker opened after Redis timeouts. Chain confirmed.',
  },
  {
    step: 3,
    tool: 'K8s Events',
    toolColor: 'var(--yellow)',
    toolBg: 'var(--yellow-dim)',
    toolBorder: 'var(--yellow-border)',
    icon: '⚡',
    cmd: 'kubectl describe pod redis-cache-0 -n production',
    thought: 'Why is Redis using that much memory?',
    findings: [
      { text: 'OOMKill Warning',  detail: '07:09:14 — 4 min before P1', status: 'warn', tag: 'EARLY' },
      { text: 'maxmemory-policy', detail: 'noeviction — won\'t evict',  status: 'crit', tag: 'CONFIG' },
      { text: 'Memory limit',     detail: '8Gi — no headroom left',     status: 'warn', tag: 'LIMIT' },
    ],
    insight: 'noeviction policy + no headroom = guaranteed OOM cascade.',
  },
];

function InvestigationShowcase() {
  const [activeStep, setActiveStep] = useState(0);
  const step = TIMELINE_STEPS[activeStep];

  return (
    <div className={styles.invShowcase}>

      {/* Step selector tabs */}
      <div className={styles.invTabs}>
        {TIMELINE_STEPS.map((s, i) => (
          <button
            key={s.step}
            className={`${styles.invTab} ${activeStep === i ? styles.invTabActive : ''}`}
            style={activeStep === i ? { borderColor: s.toolBorder, color: s.toolColor } : {}}
            onClick={() => setActiveStep(i)}
          >
            <span className={styles.invTabStep}>STEP {s.step}</span>
            <span className={styles.invTabTool}
              style={activeStep === i
                ? { color: s.toolColor, background: s.toolBg, borderColor: s.toolBorder }
                : {}}>
              {s.tool}
            </span>
          </button>
        ))}
        <div className={styles.invTabsNote}>click a step →</div>
      </div>

      {/* Terminal window */}
      <div className={styles.invTerminal}>

        {/* Bar */}
        <div className={styles.invTermBar}>
          <div className={styles.panelDots}>
            <span style={{ background: '#ff5f56' }} />
            <span style={{ background: '#ffbd2e' }} />
            <span style={{ background: '#27c93f' }} />
          </div>
          <span className={styles.invTermTitle}>oncall@prod:~$</span>
          <span className={styles.invTermBadge}
            style={{ color: step.toolColor, background: step.toolBg, borderColor: step.toolBorder }}>
            {step.tool}
          </span>
        </div>

        {/* Thought bubble */}
        <div className={styles.invThought}>
          <span className={styles.invThoughtIcon}>💭</span>
          <span className={styles.invThoughtText}>{step.thought}</span>
        </div>

        {/* Command line */}
        <div className={styles.invCmdLine} key={`cmd-${activeStep}`}>
          <span className={styles.invPrompt}>$</span>
          <span className={styles.invCmd}>{step.cmd}</span>
          <span className={styles.invCursor} />
        </div>

        {/* Findings rows */}
        <div className={styles.invFindings} key={`findings-${activeStep}`}>
          {step.findings.map((f, i) => (
            <div
              key={i}
              className={`${styles.invFinding} ${styles[`invF_${f.status}`]}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={styles.invFindingTag}
                style={
                  f.status === 'crit' ? { color: 'var(--red-soft)', background: 'var(--red-dim)', borderColor: 'var(--red-border)' } :
                  f.status === 'warn' ? { color: 'var(--yellow)', background: 'var(--yellow-dim)', borderColor: 'var(--yellow-border)' } :
                  { color: 'var(--green-soft)', background: 'var(--green-dim)', borderColor: 'var(--green-border)' }
                }
              >{f.tag}</span>
              <span className={styles.invFindingText}>{f.text}</span>
              <span className={styles.invFindingDetail}>{f.detail}</span>
            </div>
          ))}
        </div>

        {/* Insight callout */}
        <div className={styles.invInsight} key={`insight-${activeStep}`}>
          <span className={styles.invInsightIcon}>→</span>
          <span className={styles.invInsightText}>{step.insight}</span>
        </div>

        {/* Step progress dots */}
        <div className={styles.invDots}>
          {TIMELINE_STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.invDot} ${activeStep === i ? styles.invDotActive : ''}`}
              onClick={() => setActiveStep(i)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

/* ── Main component ── */
export default function Landing() {
  const navigate  = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [activeId,  setActiveId]  = useState(() => {
    const s = Number(sessionStorage.getItem('selectedIncidentId'));
    return Number.isInteger(s) && s > 0 ? s : null;
  });

  useEffect(() => {
    fetch(`${API_BASE}/incidents`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || !data.length) return;
        setIncidents(data);
        const stored = Number(sessionStorage.getItem('selectedIncidentId'));
        const chosen = data.find(i => i.rawId === stored) || data[0];
        setActiveId(chosen.rawId);
        sessionStorage.setItem('selectedIncidentId', chosen.rawId);
      })
      .catch(() => {});
  }, []);

  const active = incidents.find(i => i.rawId === activeId) || incidents[0] || null;

  function handleStart() {
    if (active) sessionStorage.setItem('selectedIncidentId', active.rawId);
    navigate('/incident');
  }

  return (
    <div className={styles.page}>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <NavLogo onClick={() => {}} />
        <div className={styles.navRight}>
          <div className={styles.navStatus}>
            <span className={styles.navPulse} />
            {incidents.length > 0
              ? `${incidents.length} incident${incidents.length === 1 ? '' : 's'} active`
              : 'connecting…'}
          </div>
          <span className={styles.navChip}>BETA</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>

        {/* Left — copy */}
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>SRE Simulation Platform</p>

          <h1 className={styles.heroHeading}>
            The gap between knowing the tools and
            {' '}<em className={styles.heroHeadingEm}>surviving production.</em>
          </h1>

          <p className={styles.heroBody}>
            You've done the labs. You know kubectl. But when the pager fires at
            3&nbsp;AM - what do you check <strong>first</strong>?
          </p>

          <ul className={styles.heroBullets}>
            <li><span className={styles.heroBulletDot} />Realistic P1 incidents with real signals</li>
            <li><span className={styles.heroBulletDot} />Metrics, logs, events, terminal — no hints</li>
            <li><span className={styles.heroBulletDot} />AI-graded RCA with senior SRE feedback</li>
          </ul>

          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={handleStart}>
              <span className={styles.btnDot} />
              Respond to {active ? active.id : 'active incident'}
            </button>
            <span className={styles.heroMeta}>
              {active
                ? `${active.severityLabel || active.severity} · ${active.service}`
                : 'no signup · ~15 min · incident ready'}
            </span>
          </div>
        </div>

        {/* Right — platform screenshots */}
        <div className={styles.heroVisual}>
          <PlatformShowcase />
        </div>

      </section>

      <Divider label="investigation preview" />

      {/* ── Preview ── */}
      <section className={styles.section}>
        <div className={styles.previewLayout}>
          <div className={styles.previewCopy}>
            <p className={styles.eyebrow}>What you'll actually do</p>
            <h2 className={styles.sectionTitle}>No walkthroughs.<br />No hints.<br />Just signals.</h2>
            <p className={styles.previewDesc}>
              You get the same tools a real SRE has — metrics, logs, events, and a terminal.
              No guided steps. No answer key. Figure it out before the timer runs out.
            </p>
            <div className={styles.previewPills}>
              <span className={styles.previewPill} style={{ color: 'var(--red-soft)', background: 'var(--red-dim)', borderColor: 'var(--red-border)' }}>Metrics</span>
              <span className={styles.previewPill} style={{ color: 'var(--blue-soft)', background: 'var(--blue-dim)', borderColor: 'var(--blue-border)' }}>Logs</span>
              <span className={styles.previewPill} style={{ color: 'var(--yellow)', background: 'var(--yellow-dim)', borderColor: 'var(--yellow-border)' }}>K8s Events</span>
              <span className={styles.previewPill} style={{ color: 'var(--green-soft)', background: 'var(--green-dim)', borderColor: 'var(--green-border)' }}>Terminal</span>
            </div>
          </div>
          <div className={styles.previewTerminals}>
            <InvestigationShowcase />
          </div>
        </div>
        <p className={styles.previewNote}>
          ↑ This is what you see. What you do next is up to you.
        </p>
      </section>

      <Divider label="vs. other platforms" />

      {/* ── Compare ── */}
      <section className={styles.section}>
        <div className={styles.compareHeader}>
          <p className={styles.eyebrow}>Why it's different</p>
          <h2 className={styles.sectionTitle}>Other platforms teach configuration.<br />We teach diagnosis.</h2>
        </div>
        <div className={styles.compareTable}>
          <div className={styles.compareHead}>
            <span className={styles.compareColLabel} style={{ color: 'var(--text-muted)' }}>Other platforms</span>
            <span />
            <span className={styles.compareColLabel} style={{ color: 'var(--amber-soft)' }}>Incident Zero</span>
          </div>
          {COMPARE.map((row, i) => (
            <div key={i} className={styles.compareRow}>
              <span className={styles.compareThemCell}>
                <span className={styles.compareX}>✕</span>
                {row.them}
              </span>
              <span className={styles.compareArrow}>→</span>
              <span className={styles.compareUsCell}>
                <span className={styles.compareCheck}>✓</span>
                {row.us}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Divider label="scoring" />

      {/* ── Scoring ── */}
      <section className={styles.scoringSection}>
        <div className={styles.scoringInner}>
          {/* Left copy */}
          <div className={styles.scoringCopy}>
            <p className={styles.eyebrow}>After every incident</p>
            <h2 className={styles.sectionTitle}>Your investigation gets graded — honestly.</h2>
            <p className={styles.scoringBody}>
              Not just whether you found the root cause. How you investigated.
              What you checked, what you skipped, and whether your thinking
              matches how a senior SRE approaches a P1.
            </p>
            <div className={styles.scoringBreakdown}>
              {[
                { label: 'RCA quality',        pts: '65 pts', desc: 'Did your analysis identify the real root cause and chain of events?' },
                { label: 'Investigation depth', pts: '35 pts', desc: 'Did you use all available tools — metrics, logs, events, terminal?' },
              ].map(b => (
                <div key={b.label} className={styles.scoringBreakdownItem}>
                  <div className={styles.scoringBreakdownTop}>
                    <span className={styles.scoringBreakdownLabel}>{b.label}</span>
                    <span className={styles.scoringBreakdownPts}>{b.pts}</span>
                  </div>
                  <p className={styles.scoringBreakdownDesc}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — two example cards */}
          <div className={styles.scoringCards}>
            {/* Bad example */}
            <div className={`${styles.scoreExCard} ${styles.scoreExCardBad}`}>
              <div className={styles.scoreExHeader}>
                <span className={styles.scoreExId}>INC-001</span>
                <span className={styles.scoreExScore} style={{ color: 'var(--red-soft)' }}>34<span className={styles.scoreExMax}>/100</span></span>
              </div>
              <div className={styles.scoreExBar}>
                <div className={styles.scoreExBarFill} style={{ width: '34%', background: 'var(--red)' }} />
              </div>
              <div className={styles.scoreExGrade} style={{ color: 'var(--red-soft)', borderColor: 'var(--red-border)', background: 'var(--red-dim)' }}>Keep Practicing</div>
              <div className={styles.scoreExItems}>
                <div className={`${styles.scoreExItem} ${styles.scoreExFail}`}><span>✗</span>Restarted pod before diagnosing</div>
                <div className={`${styles.scoreExItem} ${styles.scoreExFail}`}><span>✗</span>Never checked Redis metrics</div>
                <div className={`${styles.scoreExItem} ${styles.scoreExFail}`}><span>✗</span>Skipped Kubernetes Events</div>
                <div className={`${styles.scoreExItem} ${styles.scoreExFail}`}><span>✗</span>Skipped terminal entirely</div>
              </div>
            </div>

            {/* Good example */}
            <div className={`${styles.scoreExCard} ${styles.scoreExCardGood}`}>
              <div className={styles.scoreExHeader}>
                <span className={styles.scoreExId}>INC-001</span>
                <span className={styles.scoreExScore} style={{ color: 'var(--green-soft)' }}>91<span className={styles.scoreExMax}>/100</span></span>
              </div>
              <div className={styles.scoreExBar}>
                <div className={styles.scoreExBarFill} style={{ width: '91%', background: 'var(--green)' }} />
              </div>
              <div className={styles.scoreExGrade} style={{ color: 'var(--green-soft)', borderColor: 'var(--green-border)', background: 'var(--green-dim)' }}>Outstanding</div>
              <div className={styles.scoreExItems}>
                <div className={`${styles.scoreExItem} ${styles.scoreExOk}`}><span>✓</span>Identified Redis memory exhaustion</div>
                <div className={`${styles.scoreExItem} ${styles.scoreExOk}`}><span>✓</span>Spotted latency spike in metrics first</div>
                <div className={`${styles.scoreExItem} ${styles.scoreExOk}`}><span>✓</span>Confirmed via kubectl describe</div>
                <div className={`${styles.scoreExItem} ${styles.scoreExOk}`}><span>✓</span>Described cascading failure chain</div>
              </div>
              <div className={styles.scoreExLesson}>
                <span className={styles.scoreExLessonTag}>LESSON</span>
                Redis latency spiked before the circuit breaker opened. Check dependency metrics first.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaPrompt}>
          <span className={styles.ctaPs}>oncall@prod:~$</span>
          <span className={styles.ctaCmd}>&nbsp;respond --incident INC-001 --severity P1</span>
        </div>
        <p className={styles.ctaNote}>One incident. No hints. Just you and the signals.</p>
        <button className={styles.btnPrimary} onClick={() => navigate('/incidents')}>
          <span className={styles.btnDot} />
          Start investigation
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>incident-zero · v1.0.0</span>
        <span>Built for SREs, by an SRE.</span>
        <span>© 2026</span>
      </footer>

    </div>
  );
}
