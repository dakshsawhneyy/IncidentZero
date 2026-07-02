export const incident001 = {
  id: 'INC-001',
  title: 'Checkout API Latency Spike',
  severity: 'P1',
  severityLabel: 'Critical',
  status: 'FIRING',
  service: 'checkout-api',
  team: 'Platform Engineering',
  startTime: '07:13 AM',
  date: 'Thu, Jul 02, 2026',
  slo: 'Checkout latency SLO breached (P99 > 500ms)',
  description:
    'Checkout API response time has spiked from a baseline of 80ms to 1.2s. Customers are experiencing failures during order placement. Error rate on /api/checkout endpoint is up from 0.2% to 18%. On-call engineer has been paged.',
  affectedServices: ['checkout-api', 'payment-api', 'redis-cache'],
  customerImpact: 'Customers unable to place orders. ~2,400 failed transactions in last 15 minutes.',
};

export const logs = [
  { time: '07:12:41', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 200 82ms' },
  { time: '07:12:44', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 200 79ms' },
  { time: '07:12:58', level: 'WARN',  service: 'checkout-api', message: 'Redis connection slow — latency 340ms (threshold: 100ms)' },
  { time: '07:13:01', level: 'ERROR', service: 'checkout-api', message: 'Redis dial tcp 10.0.1.45:6379: i/o timeout' },
  { time: '07:13:01', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 503 1247ms' },
  { time: '07:13:02', level: 'ERROR', service: 'checkout-api', message: 'Redis dial tcp 10.0.1.45:6379: i/o timeout' },
  { time: '07:13:02', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 503 1231ms' },
  { time: '07:13:03', level: 'WARN',  service: 'checkout-api', message: 'Circuit breaker OPEN for dependency: redis-cache' },
  { time: '07:13:04', level: 'ERROR', service: 'checkout-api', message: 'Failed to acquire session lock — dependency unavailable' },
  { time: '07:13:05', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 503 1198ms' },
  { time: '07:13:07', level: 'ERROR', service: 'redis-cache',  message: 'maxmemory limit reached: evicting keys with policy allkeys-lru' },
  { time: '07:13:07', level: 'ERROR', service: 'redis-cache',  message: 'Client connection refused: too many clients (maxclients=1000)' },
  { time: '07:13:09', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 503 1204ms' },
  { time: '07:13:11', level: 'ERROR', service: 'payment-api',  message: 'Upstream checkout-api returned 503, aborting payment flow' },
  { time: '07:13:12', level: 'WARN',  service: 'checkout-api', message: 'Retry attempt 1/3 for redis key: session:cart:u8821' },
  { time: '07:13:13', level: 'ERROR', service: 'checkout-api', message: 'All retries exhausted for redis-cache. Request failed.' },
  { time: '07:13:15', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 503 1312ms' },
  { time: '07:13:18', level: 'ERROR', service: 'redis-cache',  message: 'OOM command not allowed when used memory > maxmemory' },
  { time: '07:13:21', level: 'INFO',  service: 'checkout-api', message: 'POST /api/checkout 503 1189ms' },
  { time: '07:13:24', level: 'WARN',  service: 'checkout-api', message: 'High error rate detected: 18.3% over last 60s' },
];

export const metrics = {
  latency: {
    label: 'P99 Latency',
    before: '80ms',
    after: '1,247ms',
    change: '+1,459%',
    status: 'critical',
    unit: 'ms',
    sparkline: [80, 82, 79, 83, 91, 180, 420, 780, 1100, 1200, 1247, 1231, 1198, 1204, 1312, 1189],
  },
  errorRate: {
    label: 'Error Rate',
    before: '0.2%',
    after: '18.3%',
    change: '+18.1%',
    status: 'critical',
    unit: '%',
    sparkline: [0.2, 0.3, 0.2, 0.4, 1.2, 4.5, 9.1, 13.4, 16.2, 17.8, 18.1, 18.3, 18.0, 18.5, 18.3, 18.2],
  },
  throughput: {
    label: 'Throughput (RPS)',
    before: '420',
    after: '312',
    change: '-25.7%',
    status: 'warning',
    unit: 'rps',
    sparkline: [420, 418, 422, 419, 415, 401, 380, 360, 345, 330, 318, 312, 315, 311, 312, 310],
  },
  redisLatency: {
    label: 'Redis Latency',
    before: '2ms',
    after: '340ms+',
    change: '+16,900%',
    status: 'critical',
    unit: 'ms',
    sparkline: [2, 2, 3, 2, 2, 8, 45, 120, 240, 310, 340, 380, 360, 370, 340, 390],
  },
  cpu: {
    label: 'CPU Usage',
    before: '35%',
    after: '38%',
    change: '+3%',
    status: 'healthy',
    unit: '%',
    sparkline: [35, 34, 36, 35, 35, 36, 37, 38, 37, 38, 38, 37, 38, 38, 37, 38],
  },
  memory: {
    label: 'Memory Usage',
    before: '52%',
    after: '54%',
    change: '+2%',
    status: 'healthy',
    unit: '%',
    sparkline: [52, 52, 53, 52, 52, 53, 53, 54, 54, 54, 54, 54, 54, 54, 53, 54],
  },
};

export const events = [
  {
    time: '07:12:55',
    type: 'Warning',
    source: 'redis-cache',
    reason: 'MemoryPressure',
    message: 'Redis memory usage at 94% of maxmemory (7.52GB / 8GB). Key eviction started.',
    count: 1,
  },
  {
    time: '07:13:00',
    type: 'Warning',
    source: 'redis-cache',
    reason: 'ConnectionPoolExhausted',
    message: 'Connection pool exhausted. Active connections: 1000/1000. New connections being rejected.',
    count: 48,
  },
  {
    time: '07:13:01',
    type: 'Warning',
    source: 'checkout-api',
    reason: 'DependencyTimeout',
    message: 'Dependency redis-cache is not responding within 200ms SLA. Circuit breaker threshold approaching.',
    count: 12,
  },
  {
    time: '07:13:03',
    type: 'Warning',
    source: 'checkout-api',
    reason: 'CircuitBreakerOpen',
    message: 'Circuit breaker OPENED for redis-cache after 5 consecutive failures. Fallback mode active.',
    count: 1,
  },
  {
    time: '07:13:07',
    type: 'Warning',
    source: 'redis-cache',
    reason: 'MaxClientsReached',
    message: 'Redis maxclients limit (1000) reached. New connections are being refused.',
    count: 73,
  },
  {
    time: '07:13:09',
    type: 'Normal',
    source: 'checkout-api',
    reason: 'ScalingEvent',
    message: 'HPA triggered scale-out: replicas 3 → 5 due to CPU 38% and custom latency metric.',
    count: 1,
  },
  {
    time: '07:13:11',
    type: 'Warning',
    source: 'payment-api',
    reason: 'UpstreamDegraded',
    message: 'checkout-api returning 503 errors. Payment flow failing. SLO breach detected.',
    count: 24,
  },
  {
    time: '07:13:18',
    type: 'Warning',
    source: 'redis-cache',
    reason: 'OOMError',
    message: 'Redis OOM: write commands rejected. Service is effectively read-only.',
    count: 31,
  },
];

export const terminalResponses = {
  'kubectl get pods': `NAME                          READY   STATUS    RESTARTS   AGE
checkout-api-7d9f8c-xk2pl     1/1     Running   0          2d
checkout-api-7d9f8c-p9mnv     1/1     Running   0          2d
checkout-api-7d9f8c-8rvjq     1/1     Running   0          2d
payment-api-6b8d4f-hj3kp      1/1     Running   0          5d
redis-cache-0                 1/1     Running   0          12d
postgres-0                    1/1     Running   0          12d`,

  'kubectl get pods -n production': `NAME                          READY   STATUS    RESTARTS   AGE
checkout-api-7d9f8c-xk2pl     1/1     Running   0          2d
checkout-api-7d9f8c-p9mnv     1/1     Running   0          2d
checkout-api-7d9f8c-8rvjq     1/1     Running   0          2d
payment-api-6b8d4f-hj3kp      1/1     Running   0          5d
redis-cache-0                 1/1     Running   0          12d
postgres-0                    1/1     Running   0          12d`,

  'kubectl logs checkout-api-7d9f8c-xk2pl': `2026-07-02T07:12:44Z INFO  POST /api/checkout 200 79ms
2026-07-02T07:12:58Z WARN  Redis connection slow — latency 340ms
2026-07-02T07:13:01Z ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
2026-07-02T07:13:03Z WARN  Circuit breaker OPEN for redis-cache
2026-07-02T07:13:07Z ERROR All retries exhausted. Request failed.`,
  
  'kubectl logs checkout-api-7d9f8c-p9mnv': `2026-07-02T07:12:44Z INFO  POST /api/checkout 200 79ms
2026-07-02T07:12:58Z WARN  Redis connection slow — latency 340ms
2026-07-02T07:13:01Z ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
2026-07-02T07:13:03Z WARN  Circuit breaker OPEN for redis-cache
2026-07-02T07:13:07Z ERROR All retries exhausted. Request failed.`,
  
  'kubectl logs checkout-api-7d9f8c-8rvjq': `2026-07-02T07:12:44Z INFO  POST /api/checkout 200 79ms
2026-07-02T07:12:58Z WARN  Redis connection slow — latency 340ms
2026-07-02T07:13:01Z ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
2026-07-02T07:13:03Z WARN  Circuit breaker OPEN for redis-cache
2026-07-02T07:13:07Z ERROR All retries exhausted. Request failed.`,


  'kubectl logs redis-cache-0': `2026-07-02T07:12:55Z WARNING Memory usage 94% (7.52GB/8GB). Eviction started.
2026-07-02T07:13:00Z WARNING Connection pool exhausted (1000/1000).
2026-07-02T07:13:07Z ERROR  maxclients limit reached. Connections refused.
2026-07-02T07:13:18Z ERROR  OOM: write commands not allowed.`,

  'kubectl describe pod redis-cache-0': `Name:         redis-cache-0
Namespace:    production
Status:       Running
IP:           10.0.1.45
Containers:
  redis:
    Image:        redis:7.0
    Limits:
      memory:     8Gi
      cpu:        2
    Requests:
      memory:     4Gi
      cpu:        500m
    Environment:
      REDIS_MAXMEMORY:          8gb
      REDIS_MAXMEMORY_POLICY:   allkeys-lru
      REDIS_MAXCLIENTS:         1000
Events:
  Warning  MemoryPressure       2m   kubelet  Memory usage at 94%
  Warning  OOMKillThreshold     1m   kubelet  Approaching OOM kill`,

  'kubectl top pods': `NAME                          CPU(cores)   MEMORY(bytes)
checkout-api-7d9f8c-xk2pl     42m          180Mi
checkout-api-7d9f8c-p9mnv     39m          172Mi
checkout-api-7d9f8c-8rvjq     41m          176Mi
payment-api-6b8d4f-hj3kp      28m          145Mi
redis-cache-0                 180m         7680Mi
postgres-0                    35m          512Mi`,

  'kubectl get events': `LAST SEEN   TYPE      REASON                    OBJECT           MESSAGE
2m          Warning   MemoryPressure            redis-cache-0    Memory at 94%
2m          Warning   ConnectionPoolExhausted   redis-cache-0    Pool exhausted (1000/1000)
2m          Warning   CircuitBreakerOpen        checkout-api     CB open for redis-cache
1m          Normal    ScalingEvent              checkout-api     HPA: replicas 3→5
1m          Warning   UpstreamDegraded          payment-api      checkout-api returning 503`,

  'kubectl get svc': `NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
checkout-api    ClusterIP   10.96.42.15     <none>        8080/TCP   30d
payment-api     ClusterIP   10.96.18.33     <none>        8080/TCP   30d
redis-cache     ClusterIP   10.96.101.45    <none>        6379/TCP   30d
postgres        ClusterIP   10.96.55.22     <none>        5432/TCP   30d`,

  'kubectl get hpa': `NAME           REFERENCE                 TARGETS           MINPODS   MAXPODS   REPLICAS
checkout-api   Deployment/checkout-api   38%/70%, 3/3      3         10        5`,

  'kubectl rollout history deployment/checkout-api': `REVISION  CHANGE-CAUSE
1         Initial deployment
2         Update to v1.2.1 — performance improvements
3         Hotfix: increase redis connection timeout`,
};

export const rootCauseAnswer = {
  primaryCause: 'Redis memory exhaustion',
  explanation:
    'Redis reached its 8GB memory limit, causing key eviction and connection pool exhaustion. This made the redis-cache dependency unavailable for checkout-api, triggering circuit breaker open state and cascading 503 errors to all checkout requests.',
  keyClues: [
    'Redis latency spike from 2ms → 340ms (earliest signal)',
    'Redis memory at 94% in events (preceding the incident)',
    'ConnectionPoolExhausted event on redis-cache-0',
    'Circuit breaker OPEN in checkout-api logs',
    'kubectl top pods showing redis-cache-0 at 7680Mi / 8Gi',
  ],
  investigationPath: [
    'Check Metrics (Redis latency is the leading indicator)',
    'Check Events (MemoryPressure on redis-cache)',
    'Check Logs (circuit breaker open, i/o timeout)',
    'Check Terminal (kubectl top pods, kubectl describe redis-cache-0)',
  ],
  commonMistakes: [
    'Restarting checkout-api first (symptom, not root cause)',
    'Scaling checkout-api replicas (will worsen Redis connection exhaustion)',
    'Ignoring Redis metrics and focusing only on API logs',
  ],
};
