# Deploy Fernwell to EC2 (GitHub Actions, no CloudFormation)

Your AWS Academy sandbox has a service control policy that **explicitly denies CloudFormation**, including `cloudformation:ValidateTemplate`. The original CloudFormation-based pipeline therefore cannot run there. This version deploys directly to an EC2 instance you create once.

```
push to main (or Run workflow)
   │
   ├─ build job ── npm ci → npm run build (VITE_API_URL=/api) → frontend/dist artifact
   │
   └─ deploy job ─ read .github/deploy-config.env
                  → start the instance if it was stopped, read the current public IP
                  → fetch the SSH private key from SSM Parameter Store
                  → one-time bootstrap: install nginx, Node.js, MongoDB, systemd service
                  → copy React dist/ and backend/ to the instance
                  → npm ci on the instance, write .env from project config, npm run seed
                  → restart fernwell-api, check website and /api
```

The instance is created once. Later pushes only replace the app files, so the site keeps the same address (unless the instance is stopped/started).

> Your existing `.github/workflows/ci.yml` is unchanged. It still runs the lint/syntax checks and the optional Render deploy hooks.

## 1. One-time AWS setup (do this once)

1. In the AWS console, go to **EC2 → Instances → Launch instance**.
2. Choose **Amazon Linux 2023**, `t2.micro`, and create/download a **new key pair** (`.pem`).
3. In the security group, allow:
   - **SSH (22)** from `0.0.0.0/0` (GitHub runners have no fixed IP; restrict later if you want).
   - **HTTP (80)** from `0.0.0.0/0`.
4. Note the **Instance ID** (`i-0123456789abcdef0`) and the region (`us-east-2` for your sandbox).
5. Store the private key in **SSM Parameter Store** as a SecureString so it never has to be committed or added as a GitHub secret. Run this locally with the AWS CLI configured, or in AWS CloudShell:

   ```bash
   aws ssm put-parameter \
     --name /fernwell/ec2-ssh-key \
     --type SecureString \
     --value "$(cat ~/Downloads/your-key.pem)" \
     --overwrite \
     --region us-east-2
   ```

   Replace the path/filename to match yours. The workflow reads this parameter at deploy time.

## 2. Configure GitHub Secrets and project settings

Only the three AWS credentials are kept in GitHub Secrets. Everything else is read from `.github/deploy-config.env`.

**GitHub Secrets** — Settings → Secrets and variables → Actions → Secrets:

| Name | Value | Needed for |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | Access Key ID from the AWS Academy sandbox (starts with `ASIA`) | EC2, SSM |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key from the same sandbox | EC2, SSM |
| `AWS_SESSION_TOKEN` | Session token shown with those temporary keys | Required whenever the access key starts with `ASIA` |

The workflow trims whitespace/newlines from these values before using them.

**Project config** — `.github/deploy-config.env`:

| Key | Example | Purpose |
| --- | --- | --- |
| `AWS_REGION` | `us-east-2` | Region of your sandbox and instance |
| `INSTANCE_ID` | `i-0123456789abcdef0` | Instance created in step 1 |
| `SSH_KEY_PARAM` | `/fernwell/ec2-ssh-key` | SSM parameter holding the private key |
| `ADMIN_EMAIL` | `admin@fernwell.com` | Email of the first admin user |
| `DB_URL` | `mongodb://127.0.0.1:27017/fernwell` | MongoDB connection string (MongoDB is installed on the instance) |
| `JWT_SECRET` | `kul-is-cool` | Signs login tokens |
| `ADMIN_PASSWORD` | `admin123` | Password for the first admin user |

The workflow refuses to run while any value still says `replace-...`.

Notes:

- AWS Academy keys are temporary. All three AWS secrets change together when the lab restarts; update them together. Rotate any credentials that appeared in chat.
- `DB_URL`, `JWT_SECRET` and `ADMIN_PASSWORD` are committed in the repo, so anyone with repository access can read them. GitHub Secrets are safer; if you change your mind, add those three as secrets and restore `${{ secrets.NAME }}` references in the workflow.
- The private SSH key is **not** in the repo — it lives in SSM. If your sandbox denies `ssm:GetParameter`, put the key in a GitHub secret instead and change the "Get SSH key from SSM" step to write that secret to `ec2-key.pem`.

## 3. Trigger the pipeline

- Push a change under `backend/`, `frontend/`, `scripts/`, or the workflow/config files, **or**
- Open **Actions → Deploy MERN app to EC2 → Run workflow**.

The first run takes a few minutes while packages install. The run summary shows the site and API URLs. Open `http://<public-ip>` and log in with `admin@fernwell.com` and your `ADMIN_PASSWORD`.

## 4. Why there is no API URL to configure

The React build uses `VITE_API_URL=/api`. nginx serves the site at `/` and forwards `/api/*` to Express on `127.0.0.1:8000`:

- No public IP is baked into the frontend bundle.
- No CORS problem, because the browser sees one origin.
- A changed public IP after a stop/start still works.

The API gets `CLIENT_URL=http://<current-public-ip>` in its `.env` so CORS matches the browser address.

## 5. Files in this pipeline

| File | What it does |
| --- | --- |
| `.github/workflows/deploy-ec2.yml` | Build + deploy workflow (push to `main` or manual) |
| `.github/deploy-config.env` | Region, instance ID, SSM key path, MongoDB and admin settings |
| `scripts/ec2-bootstrap.sh` | One-time server setup: nginx, Node.js, MongoDB, systemd service |
| `docs/EC2-DEPLOYMENT.md` | This guide |
| `infra/ec2-app.yaml` | Original CloudFormation template, kept as a reference only — **not used** because the sandbox denies CloudFormation |

Nothing in `backend/` or `frontend/` source was changed, so local development still works as before.

## 6. Useful commands on the instance

```bash
sudo systemctl status fernwell-api     # API process
sudo systemctl status mongod           # Database
sudo journalctl -u fernwell-api -n 50  # API logs
sudo tail -f /var/log/nginx/error.log  # nginx errors
curl http://localhost/api/             # should return {"success":true,...}
```

Change app settings by editing `.github/deploy-config.env` and pushing. Change AWS credentials by updating the three GitHub Secrets. The `.env` on the instance is rewritten on every deploy.

Repeat deploys are quick: server setup runs once, `node_modules` stays on the instance (so `npm ci` only runs when `backend/package-lock.json` changes), and seeding is skipped when `DB_URL` is unchanged.

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `AccessDenied ... cloudformation:ValidateTemplate` | CloudFormation is denied by your sandbox SCP. This workflow no longer calls CloudFormation — make sure you pulled the latest `main`. |
| `Invalid character in header content ["x-amz-security-token"]` | A hidden newline in the session token secret. The workflow trims it; if it persists, re-create the secret with a single-line paste. |
| `SignatureDoesNotMatch` / `InvalidClientTokenId` | AWS keys are swapped, expired, or missing the session token. Copy all three fresh sandbox values together. |
| Workflow stops at "Check AWS secrets and deploy config" | Fill the `replace-...` values in `.github/deploy-config.env` or add the missing AWS secret. |
| `InvalidInstanceID.NotFound` | The instance ID is wrong or belongs to another region. Check `INSTANCE_ID` and `AWS_REGION`. |
| `SSH not ready yet ...` for the full loop | Check the security group allows port 22 from GitHub runners, the key in SSM matches the instance's key pair, and the instance is in a public subnet. |
| Bootstrap fails during `dnf install` | Read the error in the workflow log. Usually a blocked package repo; the sandbox must allow access to `repo.mongodb.org`. |
| Site loads but API calls fail / 502 | Read the API logs in the failed step. Usually `mongod` is not running or `DB_URL` is wrong. |
| Site works, then disappears | The sandbox stopped the instance. The next deploy starts it again; a restart can change the IP, so use the latest URL from the workflow summary. |
| Login fails with the old admin password | `npm run seed` only creates the admin once. Change the password in MongoDB, or delete that admin user and re-run with a new `ADMIN_PASSWORD`. |
| Want to stop charges | Terminate the EC2 instance in the console and delete the `/fernwell/ec2-ssh-key` SSM parameter. |
