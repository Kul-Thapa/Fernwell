# Simplest EC2 CI/CD for Fernwell

No CloudFormation, no AWS API calls, no AWS credentials in GitHub. You create one EC2 instance once; after that GitHub just SSHes in and runs `deploy/update.sh`.

## 1. Create the EC2 instance (once)

1. AWS Console → **EC2 → Launch instance**.
2. **Amazon Linux 2023**, `t2.micro`.
3. Create and download a key pair (`.pem`).
4. Security group: allow **SSH (22)** and **HTTP (80)** from `0.0.0.0/0`.
5. In **Advanced details → User data**, paste the entire contents of [`deploy/setup-server.sh`](../deploy/setup-server.sh).
6. Launch it and wait ~5–10 minutes. The script installs Node 22, nginx, MongoDB, clones the repo, builds the app, seeds the admin, and starts the services.

If you prefer not to use User Data, SSH in after launch and run:

```bash
sudo bash <(curl -fsSL https://raw.githubusercontent.com/Kul-Thapa/Fernwell/main/deploy/setup-server.sh)
```

Edit the values at the top of that script first if you want different MongoDB/JWT/admin settings.

## 2. Add one GitHub Secret

**Settings → Secrets and variables → Actions → Secrets → New repository secret**

| Name | Value |
| --- | --- |
| `EC2_SSH_KEY` | The entire contents of the `.pem` file you downloaded |

## 3. Set the host in the workflow

Edit `.github/workflows/deploy.yml`:

```yaml
EC2_HOST: replace-with-your-ec2-public-ip
```

Replace it with the instance's public IP and commit.

## 4. Deploy

Push to `main`, or run **Actions → Deploy to EC2 → Run workflow**.

Every run:

```
git pull → frontend npm ci + build → copy to nginx → backend npm ci → restart API
```

The run summary is just the SSH output; open `http://<your-ec2-ip>` to see the site.

## Files

| File | Purpose |
| --- | --- |
| `.github/workflows/deploy.yml` | SSH deploy workflow |
| `deploy/setup-server.sh` | One-time instance setup (User Data) |
| `deploy/update.sh` | Runs on every deploy |
| `docs/EC2-SETUP.md` | This guide |

The existing `.github/workflows/ci.yml` is untouched.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Set EC2_HOST ...` error | Replace the placeholder in `deploy.yml`. |
| `Add EC2_SSH_KEY ...` error | Add the `.pem` contents as that secret. |
| SSH times out | Security group must allow port 22; check the IP is correct. |
| Permission denied (publickey) | The key must match the key pair chosen at launch. |
| Site loads, API fails | On the instance run `sudo journalctl -u fernwell-api -n 50`. |
| Want to stop charges | Terminate the instance in the AWS console. |
