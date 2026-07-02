import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

const features = [
  {
    icon: '🚨',
    title: 'Real Incidents',
    desc: 'Not labs. Not tasks. Incidents — the way they actually hit you at 2 AM.',
  },
  {
    icon: '🔍',
    title: 'Investigate, Not Follow',
    desc: 'No guided steps. You decide what to check first. Your methodology is what gets scored.',
  },
  {
    icon: '📊',
    title: 'Think Under Pressure',
    desc: 'Timer running. Metrics firing. Logs scrolling. Just like the real thing.',
  },
  {
    icon: '🧠',
    title: 'Get Smarter Each Time',
    desc: 'Post-incident analysis shows exactly where your investigation went wrong — and why.',
  },
];

const diffs = [
  { them: 'Deploy nginx to Kubernetes', us: 'Nginx is already running. Now why is it returning 502?' },
  { them: 'Learn kubectl commands', us: 'A P1 alert is firing. Which command do you run first?' },
  { them: 'Configure Prometheus', us: 'Prometheus is showing a spike. What does it mean?' },
  { them: 'Complete structured labs', us: 'No instructions. Just signals, logs, and a timer.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>Incident<span className={styles.logoBold}>Zero</span></span>
        </div>
        <div className={styles.navLinks}>
          <span className={styles.navBadge}>BETA</span>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.alertBanner}>
          <span className={styles.alertDot}></span>
          <span className={styles.alertText}>LIVE INCIDENT SIMULATION</span>
        </div>

        <h1 className={styles.heroTitle}>
          Stop learning tools.<br />
          <span className={styles.heroAccent}>Start surviving incidents.</span>
        </h1>

        <p className={styles.heroSub}>
          A flight simulator for SREs. Investigate realistic production incidents,
          find root causes, and learn how senior engineers actually think under pressure.
        </p>

        <div className={styles.heroActions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/incident')}>
            <span className={styles.btnDot}></span>
            Start Your First Incident
          </button>
          <div className={styles.heroMeta}>
            <span>🔴 1 active incident</span>
            <span>·</span>
            <span>No signup required</span>
            <span>·</span>
            <span>~15 min</span>
          </div>
        </div>

        {/* Mock PagerDuty card */}
        <div className={styles.mockAlert}>
          <div className={styles.mockAlertHeader}>
            <div className={styles.mockAlertSource}>
              <span className={styles.pdIcon}>📟</span>
              <span>PagerDuty Alert</span>
            </div>
            <span className={styles.mockAlertTime}>07:13 AM</span>
          </div>
          <div className={styles.mockAlertBody}>
            <div className={styles.mockAlertTitle}>Checkout API latency exceeded SLO</div>
            <div className={styles.mockAlertDesc}>Customer checkout failures detected. P99 latency: 1.2s (SLO: 200ms)</div>
          </div>
          <div className={styles.mockAlertFooter}>
            <span className={styles.severityBadge}>P1 · Critical</span>
            <span className={styles.mockAlertStatus}>⏱ 00:00 — Investigation not started</span>
          </div>
        </div>
      </section>

      {/* Difference section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>WHY THIS IS DIFFERENT</span>
          <h2 className={styles.sectionTitle}>Other platforms teach tools.<br />We teach thinking.</h2>
        </div>
        <div className={styles.diffTable}>
          <div className={styles.diffCol}>
            <div className={styles.diffColHeader}>
              <span className={styles.diffBadgeOther}>Other Labs</span>
            </div>
            {diffs.map((d, i) => (
              <div key={i} className={styles.diffRowOther}>{d.them}</div>
            ))}
          </div>
          <div className={styles.diffDivider}></div>
          <div className={styles.diffCol}>
            <div className={styles.diffColHeader}>
              <span className={styles.diffBadgeUs}>Incident Zero</span>
            </div>
            {diffs.map((d, i) => (
              <div key={i} className={styles.diffRowUs}>{d.us}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>WHAT YOU GET</span>
          <h2 className={styles.sectionTitle}>Every incident is a lesson in disguise.</h2>
        </div>
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>THE EXPERIENCE</span>
          <h2 className={styles.sectionTitle}>From pager to post-mortem.</h2>
        </div>
        <div className={styles.flow}>
          {['Pager goes off', 'Open Grafana', 'Check Logs', 'Run kubectl', 'Form Hypothesis', 'Find Root Cause', 'Write RCA', 'Get Scored'].map((step, i, arr) => (
            <div key={i} className={styles.flowStep}>
              <div className={styles.flowNode}>{i + 1}</div>
              <div className={styles.flowLabel}>{step}</div>
              {i < arr.length - 1 && <div className={styles.flowArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Your first on-call shift starts now.</h2>
          <p className={styles.ctaSub}>One incident. No hints. Just you, the signals, and a running timer.</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/incident')}>
            <span className={styles.btnDot}></span>
            Respond to Incident #001
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>⚡ Incident Zero</span>
        <span className={styles.footerSep}>·</span>
        <span>Built for SREs who want to think, not just deploy.</span>
      </footer>
    </div>
  );
}
