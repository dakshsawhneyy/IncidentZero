import { useState, useEffect } from 'react';
import styles from './KubeLoader.module.css';

const INTRO = [
  { type: 'sys',   text: 'incident-zero · investigation workspace',  delay: 0    },
  { type: 'div',   text: '',                                          delay: 180  },
  { type: 'cmd',   text: 'kubectl config use-context prod-cluster',  delay: 380  },
  { type: 'ok',    text: 'Switched to context "prod-cluster".',       delay: 820  },
  { type: 'cmd',   text: 'kubectl get pods -n production',            delay: 1050 },
  { type: 'ok',    text: 'NAME                        STATUS    AGE', delay: 1500 },
  { type: 'ok',    text: 'checkout-api-7d9f8c-xk2pl   Running   4d', delay: 1600 },
  { type: 'warn',  text: 'redis-cache-0                Warning   4d', delay: 1700 },
  { type: 'ok',    text: 'payment-api-6b8d4f-hj3kp    Running   4d', delay: 1800 },
  { type: 'div',   text: '',                                          delay: 2000 },
  { type: 'cmd',   text: 'kubectl top pods -n production',            delay: 2200 },
  { type: 'ok',    text: 'NAME                        CPU    MEMORY', delay: 2650 },
  { type: 'ok',    text: 'checkout-api-7d9f8c-xk2pl   42m    180Mi', delay: 2750 },
  { type: 'crit',  text: 'redis-cache-0               180m   7680Mi  ← 96% MEM', delay: 2850 },
  { type: 'div',   text: '',                                          delay: 3050 },
  { type: 'alert', text: '🔴  P1 ALERT CONFIRMED — loading incident data',        delay: 3250 },
  { type: 'muted', text: '    syncing investigation workspace…',      delay: 3600 },
];

const LOOP = [
  { type: 'cmd',   text: 'kubectl get pods -n production --watch',   delay: 0    },
  { type: 'ok',    text: 'checkout-api-7d9f8c-xk2pl   Running   4d', delay: 600  },
  { type: 'warn',  text: 'redis-cache-0                Warning   4d', delay: 700  },
  { type: 'div',   text: '',                                          delay: 1000 },
  { type: 'muted', text: '    fetching incident telemetry…',          delay: 1200 },
  { type: 'muted', text: '    pulling logs…',                         delay: 1900 },
  { type: 'muted', text: '    pulling metrics…',                      delay: 2500 },
  { type: 'muted', text: '    pulling events…',                       delay: 3100 },
  { type: 'div',   text: '',                                          delay: 3600 },
];
const LOOP_DURATION = 4200;

export default function KubeLoader() {
  const [lines,     setLines]     = useState([]);
  const [typed,     setTyped]     = useState({});
  const [dots,      setDots]      = useState('');
  const [loopLines, setLoopLines] = useState([]);
  const [loopKey,   setLoopKey]   = useState(0);

  const seqDone = lines.length >= INTRO.length;

  // Intro sequence — plays once
  useEffect(() => {
    const timers = [];
    INTRO.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, i]);
        if (line.type === 'cmd') {
          line.text.split('').forEach((_, ci) => {
            timers.push(setTimeout(() => {
              setTyped(prev => ({ ...prev, [i]: ci + 1 }));
            }, ci * 32));
          });
        }
      }, line.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Loop block — restarts every LOOP_DURATION ms after intro done
  useEffect(() => {
    if (!seqDone) return;
    setLoopLines([]);
    const timers = [];
    LOOP.forEach((line, i) => {
      timers.push(setTimeout(() => setLoopLines(prev => [...prev, i]), line.delay));
    });
    const reset = setTimeout(() => setLoopKey(k => k + 1), LOOP_DURATION);
    timers.push(reset);
    return () => timers.forEach(clearTimeout);
  }, [seqDone, loopKey]);

  // Blinking dots
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>

        {/* Chrome bar */}
        <div className={styles.bar}>
          <div className={styles.dots}>
            <span style={{ background: '#ff5f56' }} />
            <span style={{ background: '#ffbd2e' }} />
            <span style={{ background: '#27c93f' }} />
          </div>
          <span className={styles.title}>oncall@prod — investigation workspace</span>
          <span className={styles.badge}>CONNECTING</span>
        </div>

        {/* Terminal body */}
        <div className={styles.term}>

          {/* Intro lines */}
          {INTRO.map((line, i) => {
            if (!lines.includes(i)) return null;
            const isCmd = line.type === 'cmd';
            const charCount = typed[i] ?? (isCmd ? 0 : line.text.length);
            const display = line.text.slice(0, charCount);
            const stillTyping = isCmd && charCount < line.text.length;
            return (
              <div key={`s${i}`} className={`${styles.line} ${styles[`t_${line.type}`]}`}>
                {line.type === 'cmd' && <span className={styles.prompt}>$ </span>}
                {line.type === 'div'
                  ? <span className={styles.divider}>{'─'.repeat(52)}</span>
                  : <>{display}{stillTyping && <span className={styles.inlineCursor} />}</>
                }
              </div>
            );
          })}

          {/* Loop block — continuously scrolls while waiting */}
          {seqDone && LOOP.map((line, i) => {
            if (!loopLines.includes(i)) return null;
            return (
              <div key={`l${loopKey}-${i}`} className={`${styles.line} ${styles[`t_${line.type}`]}`}>
                {line.type === 'cmd' && <span className={styles.prompt}>$ </span>}
                {line.type === 'div'
                  ? <span className={styles.divider}>{'─'.repeat(52)}</span>
                  : line.text
                }
              </div>
            );
          })}

          {/* Persistent blinking prompt */}
          <div className={styles.waitLine}>
            <span className={styles.prompt}>$ </span>
            <span className={styles.waitText}>
              {seqDone ? `loading incident data${dots}` : ''}
            </span>
            <span className={styles.blockCursor} />
          </div>
        </div>

        {/* Sweep bar */}
        <div className={styles.sweepWrap}>
          <div className={styles.sweepBar} />
        </div>

      </div>
    </div>
  );
}
