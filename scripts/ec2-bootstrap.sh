#!/bin/bash
# One-time setup for the Fernwell EC2 instance.
# Run with sudo on a fresh Amazon Linux 2023 instance, or let the deploy workflow run it.
set -euo pipefail

# nginx serves React; node/npm run the Express API. Build tools let bcrypt install.
dnf install -y nginx nodejs npm gcc-c++ make python3

# The project uses mongodb://127.0.0.1:27017/fernwell, so run MongoDB locally.
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

mkdir -p /opt/fernwell/backend
chown -R ec2-user:ec2-user /opt/fernwell /usr/share/nginx/html

# One nginx server: serve the SPA and proxy /api to Express.
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
nginx -t
systemctl enable --now nginx

echo "Fernwell EC2 bootstrap complete"
