#!/bin/bash

sudo apt update
sudo apt install docker.io docker-compose-v2 -y

systemctl enable docker
systemctl start docker

sudo usermod -aG docker $USER && newgrp docker

# Download docker-compose from github repo
curl -o docker-compose.yml \
https://raw.githubusercontent.com/dakshsawhneyy/IncidentZero/master/application/docker-compose.yml

# Export backend url in env
export VITE_API_URL="http://backend:4000"

# Run Containers
docker compose pull 
docker compose up -d --build