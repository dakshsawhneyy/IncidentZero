# Architecture deployment on OCI

    Cloudflare
        │
    incidentzero.monster
        │
        ▼
    OCI Public IP
        │
        ▼
    Ubuntu VM
        │
    Nginx
    /      \
    /        \
React        Express
            │
            ▼
        PostgreSQL