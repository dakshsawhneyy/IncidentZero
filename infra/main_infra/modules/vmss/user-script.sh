#!/bin/bash

set -euxo pipefail

# Log everything for debugging
exec > >(tee /var/log/user-script.log|logger -t user-script -s 2>/dev/console) 2>&1

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl apt-transport-https gnupg lsb-release

# Install Docker
if ! command -v docker >/dev/null 2>&1; then
	apt-get install -y --no-install-recommends docker.io
fi

systemctl enable --now docker

# Ensure docker CLI has compose plugin available
if ! docker compose version >/dev/null 2>&1; then
	apt-get install -y --no-install-recommends docker-compose-v2 || true
fi

mkdir -p /opt/incidentzero
COMPOSE_FILE_PATH="/opt/incidentzero/docker-compose.yml"

# Fetch the compose file (fall back to local repo copy if available)
if curl -fsSL -o "$COMPOSE_FILE_PATH" "https://raw.githubusercontent.com/dakshsawhneyy/IncidentZero/master/application/docker-compose.yml"; then
	echo "Fetched remote docker-compose.yml"
else
	echo "Failed to fetch remote docker-compose.yml, attempting to use bundled file" >&2
	if [ -f "$${path_module:-}/../../application/docker-compose.yml" ]; then
		cp "$${path_module:-}/../../application/docker-compose.yml" "$COMPOSE_FILE_PATH" || true
	fi
fi

# Export runtime env (used by the compose file)
export VITE_API_URL=""
export DATABASE_URL="$DATABASE_URL"
if [ -z "$${DATABASE_URL:-}" ]; then
	echo "WARNING: DATABASE_URL is not set. The backend will start, but /incidents will return 500 until the Azure PostgreSQL connection string is provided." >&2
fi

# Pull images and start containers, logging output
cd "$(dirname "$COMPOSE_FILE_PATH")" || true
docker compose pull || true
docker compose up -d --remove-orphans

# Wait a bit and verify nginx (frontend) is serving on localhost:80
sleep 6
if curl -fsS "http://127.0.0.1/" >/dev/null 2>&1; then
	echo "Local HTTP service responded on port 80"
else
	echo "Local HTTP service did not respond on port 80" >&2
	docker ps --format "{{.Names}}: {{.Status}}"
	docker compose logs --tail 100 || true
fi

echo "user-script completed"