# How incidents gonna look like

```
------------------------------------

07:13 AM

- PagerDuty Alert

Checkout API latency exceeded SLO.

Customer checkout failures detected.

Severity: P1

Incident Commander:
You

Timer:
00:00

Start Investigation

------------------------------------
```

# Incident Ideas
```
Latency increased.

CPU looks normal.

Memory looks normal.

Pods are healthy.

Error rate slowly increasing.

One downstream dependency suddenly has 800ms response time.

Now investigate.
```

------------------------------------

Incident 2
CrashLoopBackOff

Teaches:
Events
Pod logs
Kubernetes debugging

Incident 3
OOMKilled

Teaches:
Memory limits
Resource requests
JVM/Node memory

Incident 4
DNS Failure

Teaches:
Service discovery
Networking
kube-dns/CoreDNS

Incident 5
Database Connection Pool Exhaustion

Teaches:
Database bottlenecks
Connection pools
Application vs infrastructure diagnosis