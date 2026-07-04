-- Seed incident so the app works immediately after schema creation
-- INSERT INTO incidents (
--   title, severity, severity_label, status, service, team,
--   start_time, date, slo, description, affected_services, customer_impact
-- ) VALUES (
--   'Checkout API Latency Spike',
--   'P1',
--   'Critical',
--   'FIRING',
--   'checkout-api',
--   'Platform Engineering',
--   '07:13 AM',
--   'Thu, Jul 02, 2026',
--   'Checkout latency SLO breached (P99 > 500ms)',
--   'Checkout API response time has spiked from a baseline of 80ms to 1.2s. Customers are experiencing failures during order placement. Error rate on /api/checkout endpoint is up from 0.2% to 18%. On-call engineer has been paged.',
--   ARRAY['checkout-api', 'payment-api', 'redis-cache'],
--   'Customers unable to place orders. ~2,400 failed transactions in last 15 minutes.'
-- ) ON CONFLICT DO NOTHING;


-- Seed logs into incident_logs
INSERT INTO incident_logs
(incident_id,timestamp,service,level,message)
VALUES
(1,'2026-07-02 07:12:41+00','checkout-api','INFO','POST /api/checkout 200 82ms'),
(1,'2026-07-02 07:12:44+00','checkout-api','INFO','POST /api/checkout 200 79ms'),
(1,'2026-07-02 07:12:58+00','checkout-api','WARN','Redis connection slow — latency 340ms (threshold: 100ms)'),
(1,'2026-07-02 07:13:01+00','checkout-api','ERROR','Redis dial tcp 10.0.1.45:6379: i/o timeout'),
(1,'2026-07-02 07:13:01+00','checkout-api','INFO','POST /api/checkout 503 1247ms'),
(1,'2026-07-02 07:13:02+00','checkout-api','ERROR','Redis dial tcp 10.0.1.45:6379: i/o timeout'),
(1,'2026-07-02 07:13:02+00','checkout-api','INFO','POST /api/checkout 503 1231ms'),
(1,'2026-07-02 07:13:03+00','checkout-api','WARN','Circuit breaker OPEN for dependency: redis-cache'),
(1,'2026-07-02 07:13:04+00','checkout-api','ERROR','Failed to acquire session lock — dependency unavailable'),
(1,'2026-07-02 07:13:05+00','checkout-api','INFO','POST /api/checkout 503 1198ms'),
(1,'2026-07-02 07:13:07+00','redis-cache','ERROR','maxmemory limit reached: evicting keys with policy allkeys-lru'),
(1,'2026-07-02 07:13:07+00','redis-cache','ERROR','Client connection refused: too many clients (maxclients=1000)'),
(1,'2026-07-02 07:13:09+00','checkout-api','INFO','POST /api/checkout 503 1204ms'),
(1,'2026-07-02 07:13:11+00','payment-api','ERROR','Upstream checkout-api returned 503, aborting payment flow'),
(1,'2026-07-02 07:13:12+00','checkout-api','WARN','Retry attempt 1/3 for redis key: session:cart:u8821'),
(1,'2026-07-02 07:13:13+00','checkout-api','ERROR','All retries exhausted for redis-cache. Request failed.'),
(1,'2026-07-02 07:13:15+00','checkout-api','INFO','POST /api/checkout 503 1312ms'),
(1,'2026-07-02 07:13:18+00','redis-cache','ERROR','OOM command not allowed when used memory > maxmemory'),
(1,'2026-07-02 07:13:21+00','checkout-api','INFO','POST /api/checkout 503 1189ms'),
(1,'2026-07-02 07:13:24+00','checkout-api','WARN','High error rate detected: 18.3% over last 60s');


-- Seed logs into incident_metrics
INSERT INTO incident_metrics
(incident_id,metric_name,label,before_value,after_value,change_value,status,unit,sparkline)
VALUES
(1,'latency','P99 Latency','80','1247','+1459%','critical','ms','[80,82,79,83,91,180,420,780,1100,1200,1247,1231,1198,1204,1312,1189]'),
(1,'errorRate','Error Rate','0.2','18.3','+18.1%','critical','%','[0.2,0.3,0.2,0.4,1.2,4.5,9.1,13.4,16.2,17.8,18.1,18.3,18.0,18.5,18.3,18.2]'),
(1,'throughput','Throughput (RPS)','420','312','-25.7%','warning','rps','[420,418,422,419,415,401,380,360,345,330,318,312,315,311,312,310]'),
(1,'redisLatency','Redis Latency','2','340','+16900%','critical','ms','[2,2,3,2,2,8,45,120,240,310,340,380,360,370,340,390]'),
(1,'cpu','CPU Usage','35','38','+3%','healthy','%','[35,34,36,35,35,36,37,38,37,38,38,37,38,38,37,38]'),
(1,'memory','Memory Usage','52','54','+2%','healthy','%','[52,52,53,52,52,53,53,54,54,54,54,54,54,54,53,54]');


-- Seed logs into incident_events
INSERT INTO incident_events
(incident_id,timestamp,type,source,reason,message,count)
VALUES
(1,'2026-07-02 07:12:55+00','Warning','redis-cache','MemoryPressure','Redis memory usage at 94% of maxmemory (7.52GB / 8GB). Key eviction started.',1),
(1,'2026-07-02 07:13:00+00','Warning','redis-cache','ConnectionPoolExhausted','Connection pool exhausted. Active connections: 1000/1000. New connections being rejected.',48),
(1,'2026-07-02 07:13:01+00','Warning','checkout-api','DependencyTimeout','Dependency redis-cache is not responding within 200ms SLA. Circuit breaker threshold approaching.',12),
(1,'2026-07-02 07:13:03+00','Warning','checkout-api','CircuitBreakerOpen','Circuit breaker OPENED for redis-cache after 5 consecutive failures. Fallback mode active.',1),
(1,'2026-07-02 07:13:07+00','Warning','redis-cache','MaxClientsReached','Redis maxclients limit (1000) reached. New connections are being refused.',73),
(1,'2026-07-02 07:13:09+00','Normal','checkout-api','ScalingEvent','HPA triggered scale-out: replicas 3 → 5 due to CPU 38% and custom latency metric.',1),
(1,'2026-07-02 07:13:11+00','Warning','payment-api','UpstreamDegraded','checkout-api returning 503 errors. Payment flow failing. SLO breach detected.',24),
(1,'2026-07-02 07:13:18+00','Warning','redis-cache','OOMError','Redis OOM: write commands rejected. Service is effectively read-only.',31);



-- Seed logs into incident_terminal
INSERT INTO terminal_commands (incident_id,command,output)
VALUES
(1,'kubectl get pods',$$
NAME                          READY   STATUS    RESTARTS   AGE
checkout-api-7d9f8c-xk2pl     1/1     Running   0          2d
checkout-api-7d9f8c-p9mnv     1/1     Running   0          2d
checkout-api-7d9f8c-8rvjq     1/1     Running   0          2d
payment-api-6b8d4f-hj3kp      1/1     Running   0          5d
redis-cache-0                 1/1     Running   0          12d
postgres-0                    1/1     Running   0          12d
$$),

(1,'kubectl get pods -n production',$$
NAME                          READY   STATUS    RESTARTS   AGE
checkout-api-7d9f8c-xk2pl     1/1     Running   0          2d
checkout-api-7d9f8c-p9mnv     1/1     Running   0          2d
checkout-api-7d9f8c-8rvjq     1/1     Running   0          2d
payment-api-6b8d4f-hj3kp      1/1     Running   0          5d
redis-cache-0                 1/1     Running   0          12d
postgres-0                    1/1     Running   0          12d
$$),

(1,'kubectl logs checkout-api-7d9f8c-xk2pl',$$
2026-07-02T07:12:44Z INFO  POST /api/checkout 200 79ms
2026-07-02T07:12:58Z WARN  Redis connection slow — latency 340ms
2026-07-02T07:13:01Z ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
2026-07-02T07:13:03Z WARN  Circuit breaker OPEN for redis-cache
2026-07-02T07:13:07Z ERROR All retries exhausted. Request failed.
$$),

(1,'kubectl logs checkout-api-7d9f8c-p9mnv',$$
2026-07-02T07:12:44Z INFO  POST /api/checkout 200 79ms
2026-07-02T07:12:58Z WARN  Redis connection slow — latency 340ms
2026-07-02T07:13:01Z ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
2026-07-02T07:13:03Z WARN  Circuit breaker OPEN for redis-cache
2026-07-02T07:13:07Z ERROR All retries exhausted. Request failed.
$$),

(1,'kubectl logs checkout-api-7d9f8c-8rvjq',$$
2026-07-02T07:12:44Z INFO  POST /api/checkout 200 79ms
2026-07-02T07:12:58Z WARN  Redis connection slow — latency 340ms
2026-07-02T07:13:01Z ERROR Redis dial tcp 10.0.1.45:6379: i/o timeout
2026-07-02T07:13:03Z WARN  Circuit breaker OPEN for redis-cache
2026-07-02T07:13:07Z ERROR All retries exhausted. Request failed.
$$),

(1,'kubectl logs redis-cache-0',$$
2026-07-02T07:12:55Z WARNING Memory usage 94% (7.52GB/8GB). Eviction started.
2026-07-02T07:13:00Z WARNING Connection pool exhausted (1000/1000).
2026-07-02T07:13:07Z ERROR  maxclients limit reached. Connections refused.
2026-07-02T07:13:18Z ERROR  OOM: write commands not allowed.
$$),

(1,'kubectl describe pod redis-cache-0',$$
Name:         redis-cache-0
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
  Warning  OOMKillThreshold     1m   kubelet  Approaching OOM kill
$$),

(1,'kubectl top pods',$$
NAME                          CPU(cores)   MEMORY(bytes)
checkout-api-7d9f8c-xk2pl     42m          180Mi
checkout-api-7d9f8c-p9mnv     39m          172Mi
checkout-api-7d9f8c-8rvjq     41m          176Mi
payment-api-6b8d4f-hj3kp      28m          145Mi
redis-cache-0                 180m         7680Mi
postgres-0                    35m          512Mi
$$),

(1,'kubectl get events',$$
LAST SEEN   TYPE      REASON                    OBJECT           MESSAGE
2m          Warning   MemoryPressure            redis-cache-0    Memory at 94%
2m          Warning   ConnectionPoolExhausted   redis-cache-0    Pool exhausted (1000/1000)
2m          Warning   CircuitBreakerOpen        checkout-api     CB open for redis-cache
1m          Normal    ScalingEvent              checkout-api     HPA: replicas 3→5
1m          Warning   UpstreamDegraded          payment-api      checkout-api returning 503
$$),

(1,'kubectl get svc',$$
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
checkout-api    ClusterIP   10.96.42.15     <none>        8080/TCP   30d
payment-api     ClusterIP   10.96.18.33     <none>        8080/TCP   30d
redis-cache     ClusterIP   10.96.101.45    <none>        6379/TCP   30d
postgres        ClusterIP   10.96.55.22     <none>        5432/TCP   30d
$$),

(1,'kubectl get hpa',$$
NAME           REFERENCE                 TARGETS           MINPODS   MAXPODS   REPLICAS
checkout-api   Deployment/checkout-api   38%/70%, 3/3      3         10        5
$$),

(1,'kubectl rollout history deployment/checkout-api',$$
REVISION  CHANGE-CAUSE
1         Initial deployment
2         Update to v1.2.1 — performance improvements
3         Hotfix: increase redis connection timeout
$$);