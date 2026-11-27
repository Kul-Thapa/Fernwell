#!/bin/bash
# Runs on the EC2 instance whenever GitHub pushes to main.
set -euo pipefail

cd /opt/fernwell

echo "Pulling latest code..."
git pull --ff-only origin main

echo "Building frontend..."
cd frontend
npm ci
npm run build
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/

echo "Updating backend..."
cd ../backend
npm ci --omit=dev

echo "Restarting API..."
sudo systemctl restart fernwell-api

echo "Deployed $(git rev-parse --short HEAD)"
