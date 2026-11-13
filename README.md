# IncidentZero

**Live Platform:** [www.incidentzero.monster](https://www.incidentzero.monster)

A production-grade incident simulation platform for Site Reliability Engineers to practice investigating realistic production outages and receive AI-powered feedback on their investigation methodology.

---

## The Story

As a fresh graduate entering the Site Reliability Engineering field without production experience, I faced a critical challenge: there was no practical way to learn how to investigate real production incidents. Traditional labs focused on tool installation and configuration, but none addressed what happens after systems are already running and something goes wrong at 3 AM.

I built IncidentZero to solve this problem—not just for myself, but for every SRE who needs a safe environment to develop the critical thinking and systematic investigation skills that only come from hands-on incident response experience.

This platform reflects real-world scenarios: a pager goes off, systems are already deployed, and you need to figure out what went wrong using production observability tools like Grafana, Prometheus, and Kubernetes.

---

## What Makes IncidentZero Different

### Focus on Real Investigation Workflows

Unlike other incident labs that teach tool installation, IncidentZero simulates what happens in actual production environments:

```
Pager Alert
    ↓
Open Grafana Dashboard
    ↓
Query Prometheus Metrics
    ↓
Analyze Application Logs
    ↓
Check Kubernetes Events
    ↓
Form Hypothesis
    ↓
Investigate Further
    ↓
Wrong Path? Pivot.
    ↓
Identify Root Cause
    ↓
Write RCA Report
    ↓
AI Critique & Scoring
```

### AI-Powered Investigation Analysis

Students receive detailed feedback on their investigation methodology:

**Student A**
```
Investigation Score: 45/100

Reason: Restarted pod before understanding root cause.

Risk: Could hide recurring issue without addressing underlying problem.
```

**Student B**
```
Investigation Score: 95/100

Excellent systematic investigation. Followed proper debugging hierarchy and documented findings clearly.
```

---

## Platform Workflow

```
Student Opens Platform
        ↓
Incident Brief Appears
        ↓
Investigate Using Tools
        ↓
Submit Findings
        ↓
Receive Detailed Feedback Report
```

---

## Technical Architecture

### Production Infrastructure

**Deployment Stack:**
- Cloud Provider: Oracle Cloud Infrastructure (OCI)
- Domain Management: Cloudflare
- Infrastructure as Code: Terraform
- Configuration Management: Ansible
- Container Orchestration: Docker & Docker Compose
- CI/CD: GitHub Actions

**Architecture Diagram:**
```
Cloudflare DNS
    │
    ↓
incidentzero.monster
    │
    ↓
OCI Public IP
    │
    ↓
Ubuntu VM (Azure VMSS)
    │
    ↓
Nginx Reverse Proxy
    ├─────────┬─────────┐
    │         │         │
    ↓         ↓         ↓
React App   Express   PostgreSQL
(Frontend)  (Backend) (Database)
```

### Technology Stack

**Frontend:**
- React 19.2.7
- React Router DOM 6.30.1
- Vite 8.1.1
- Modern CSS Modules

**Backend:**
- Node.js with Express 4.19.2
- PostgreSQL 8.4.2
- CORS-enabled REST API
- Environment-based configuration

**Infrastructure:**
- Terraform 1.18.0
- Azure VMSS (Virtual Machine Scale Sets)
- Ansible automation
- Docker multi-stage builds
- GitHub Actions CI/CD

**Observability & Monitoring:**
- Prometheus metrics collection
- Grafana dashboards
- Kubernetes cluster monitoring
- Application log aggregation

---

## Incident Scenarios

The platform includes production-realistic scenarios covering common outage patterns:

1. **Checkout API Latency Spike**
   - Symptoms: Response time increased from 80ms to 1.2s
   - Impact: Customers unable to complete purchases
   - Severity: High

2. **CrashLoopBackOff in Kubernetes**
   - Pod restart loops
   - Service degradation
   - Resource constraints investigation

3. **OOMKilled Containers**
   - Memory exhaustion patterns
   - Resource limit analysis
   - Application profiling

4. **DNS Resolution Failures**
   - Network connectivity issues
   - Service discovery problems
   - DNS configuration debugging

5. **Database Connection Pool Exhaustion**
   - Connection leaks
   - Pool saturation
   - Performance degradation

---

## Deployment Architecture

### Automated CI/CD Pipeline

**Build Stage:**
- Multi-stage Docker builds with layer caching
- GitHub Actions cache optimization (gha backend)
- Automated image push to Docker Hub
- Frontend and backend built in parallel

**Infrastructure Stage:**
- OIDC-based Azure authentication
- Terraform state management
- Automated infrastructure provisioning
- Zero-downtime deployments

**Configuration Stage:**
- Ansible playbook execution
- Docker Compose orchestration
- Environment variable injection
- Health check verification

### Infrastructure as Code

**Terraform Modules:**
- Virtual Machine Scale Sets (VMSS)
- Network configuration (VNet, Subnets)
- Public IP allocation
- Security group rules
- Resource group management

**Ansible Automation:**
- Docker installation and configuration
- Application deployment
- Container orchestration
- Service verification

---

## Security & Best Practices

- Environment variable based configuration
- Database SSL/TLS encryption
- CORS policy enforcement
- Docker security best practices
- Secrets management via GitHub Secrets
- No hardcoded credentials in codebase

---

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/incidentzero.git
cd incidentzero
```

2. **Set up environment variables:**
```bash
cp application/backend/.env.example application/backend/.env
# Configure DATABASE_URL and other variables
```

3. **Start the development environment:**
```bash
cd application
docker compose up -d
```

4. **Run database migrations:**
```bash
cd backend
npm run migrate
```

5. **Access the application:**
- Frontend: http://localhost
- Backend API: http://localhost:4000

---

## Production Deployment

### Manual Deployment

1. **Configure Azure credentials**
2. **Update Terraform variables:**
```bash
cd infra/azure/main_infra
terraform init
terraform plan -var="admin_username=youruser" -var="DATABASE_URL=your_db_url"
terraform apply
```

3. **Run Ansible playbook:**
```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

### Automated Deployment (Recommended)

Configure GitHub Secrets:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `DATABASE_URL`

Trigger workflow: Push to main branch or manual workflow dispatch

---

## Key Achievements

**Technical Excellence:**
- Production-grade infrastructure with IaC
- Fully automated CI/CD pipeline
- Cloud-native architecture
- Zero-downtime deployment capability
- Scalable VMSS infrastructure

**Platform Features:**
- Real-world incident scenarios
- AI-powered investigation feedback
- Production observability tools integration
- Comprehensive RCA templates
- Progressive difficulty levels

**Engineering Practices:**
- Infrastructure as Code (Terraform)
- Configuration Management (Ansible)
- Containerization (Docker)
- Automated Testing & Deployment
- Security-first approach

---

## Project Structure

```
IncidentZero/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── application/
│   ├── backend/                      # Express API
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   └── migrate.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── frontend/                     # React application
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Landing.jsx
│   │   │   │   ├── Incidents.jsx
│   │   │   │   ├── Investigation.jsx
│   │   │   │   └── Report.jsx
│   │   │   └── App.jsx
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── queries/                      # Database schema & seeds
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── incident_seed/
│   └── docker-compose.yml
├── infra/
│   └── azure/
│       └── main_infra/
│           ├── main.tf               # Terraform root module
│           ├── backend.tf
│           ├── ansible.tf
│           └── modules/
│               ├── vm/
│               └── vmss/
├── ansible/
│   ├── playbook.yml                  # Deployment automation
│   └── inventory.ini
├── incidents/                        # Incident scenario definitions
└── docs/                             # Architecture documentation
```

---

## Database Schema

The platform uses PostgreSQL with the following core entities:

- **incidents:** Scenario definitions and metadata
- **investigations:** User investigation sessions
- **investigation_steps:** Timestamped investigation actions
- **reports:** Post-incident analysis submissions
- **feedback:** AI-generated scoring and recommendations

---

## API Endpoints

**Incident Management:**
- `GET /api/incidents` - List all available incidents
- `GET /api/incidents/:id` - Get incident details

**Investigation Tracking:**
- `POST /api/investigations` - Start new investigation
- `POST /api/investigations/:id/steps` - Log investigation step
- `GET /api/investigations/:id` - Get investigation history

**Report Submission:**
- `POST /api/reports` - Submit RCA report
- `GET /api/reports/:id/feedback` - Get AI feedback

---

## Monitoring & Observability

The platform provides multiple layers of observability:

**Infrastructure Level:**
- Azure Monitor integration
- VM health checks
- Network metrics
- Resource utilization

**Application Level:**
- Express.js request logging
- Error tracking
- Performance metrics
- API response times

**Database Level:**
- Query performance monitoring
- Connection pool metrics
- Slow query logging

---

## Future Roadmap

- Multi-cloud incident scenarios (AWS, GCP, Azure)
- Real-time collaborative investigation mode
- Advanced AI feedback with GPT-4 integration
- Leaderboard and gamification
- Integration with actual observability tools
- Mobile application
- Enterprise team features
- Custom incident scenario builder

---

## Contributing

This project was built as a learning platform. Contributions are welcome.

---

## License

This project is available for educational purposes.

---

## Contact & Support

- **Platform:** [www.incidentzero.monster](https://www.incidentzero.monster)
- **GitHub:** [Repository Link]
- **Issues:** Please report bugs via GitHub Issues

---

## Acknowledgments

Built with determination to bridge the gap between academic learning and production SRE experience. Special thanks to the SRE community for inspiration on realistic incident scenarios.

---

**Built by an engineer who learned that the best way to learn production incidents is to experience them—safely.**
