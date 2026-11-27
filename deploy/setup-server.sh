#!/bin/bash
# One-time setup for a fresh Amazon Linux 2023 EC2 instance.
# Paste this as EC2 User Data when launching the instance, or run it once with sudo.
set -euo pipefail

# ---------- EDIT THESE VALUES BEFORE RUNNING ----------
REPO_URL="https://github.com/Kul-Thapa/Fernwell.git"
DB_URL="mongodb://127.0.0.1:27017/fernwell"
JWT_SECRET="kul-is-cool"
ADMIN_EMAIL="admin@fernwell.com"
ADMIN_PASSWORD="admin123"
# -----------------------------------------------------

APP_DIR=/opt/fernwell
SITE_DIR=/usr/share/nginx/html

echo "Installing packages..."
dnf install -y git nginx gcc-c++ make python3
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

cat > /etc/yum.repos.d/mongodb-org-8.0.repo <<'MONGO'
[mongodb-org-8.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/8.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-8.0.asc
MONGO
dnf install -y mongodb-org
systemctl enable --now mongod

echo "Getting the code..."
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R ec2-user:ec2-user "$APP_DIR"

echo "Writing app configuration..."
cat > "$APP_DIR/frontend/.env" <<'FRONTENV'
VITE_API_URL=/api
FRONTENV

cat > "$APP_DIR/backend/.env" <<BACKENV
PORT=8000
DB_URL=$DB_URL
JWT_SECRET=$JWT_SECRET
CLIENT_URL=http://localhost
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
BACKENV
chown ec2-user:ec2-user "$APP_DIR/frontend/.env" "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"

echo "Building the app..."
sudo -u ec2-user bash -c "cd '$APP_DIR/frontend' && npm ci && npm run build"
sudo -u ec2-user bash -c "cd '$APP_DIR/backend' && npm ci --omit=dev && npm run seed"

echo "Configuring nginx..."
cat > /etc/nginx/nginx.conf <<'NGINX'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
  worker_connections 1024;
}

http {
  include /etc/mime.types;
  default_type application/octet-stream;
  sendfile on;
  keepalive_timeout 65;

  server {
    listen 80 default_server;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location = /api {
      proxy_pass http://127.0.0.1:8000/;
      proxy_set_header Host $host;
    }

    location /api/ {
      proxy_pass http://127.0.0.1:8000/;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
      try_files $uri $uri/ /index.html;
    }
  }
}
NGINX

mkdir -p "$SITE_DIR"
cp -r "$APP_DIR/frontend/dist/"* "$SITE_DIR/"
chown -R ec2-user:ec2-user "$SITE_DIR"

echo "Creating the API service..."
cat > /etc/systemd/system/fernwell-api.service <<'SERVICE'
[Unit]
Description=Fernwell Express API
After=network-online.target mongod.service
Wants=network-online.target mongod.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/fernwell/backend
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
nginx -t
systemctl enable --now nginx
systemctl enable --now fernwell-api

echo "Setup complete. Site is running at http://$(curl -fsS https://ipv4.icanhazip.com 2>/dev/null || echo '<public-ip>')"
