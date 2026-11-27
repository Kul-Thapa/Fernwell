# Deploy Fernwell to EC2 (GitHub Actions + CloudFormation)

This pipeline is the same shape as the AWS student-lab example: **build on GitHub, create one EC2 instance with CloudFormation, then copy the app over SSH**. It is adapted for a MERN app, so the Express API runs on the instance too.

```
push to main (or Run workflow)
   │
   ├─ build job ── npm ci → npm run build (VITE_API_URL=/api) → frontend/dist artifact
   │
   └─ deploy job ─ CloudFormation (EC2 + nginx + Node, created once)
                  → get SSH key from SSM
                  → start the instance if the sandbox stopped it, read the current IP
                  → copy React dist/ to nginx and backend/ to /opt/fernwell/backend
                  → npm ci on the instance, write .env from project config, npm run seed
                  → restart fernwell-api, check website and /api
```

The instance and its key pair are created once. Later pushes only replace the app files, so the site keeps the same address (unless the instance is stopped/started or the stack is recreated).

> Your existing `.github/workflows/ci.yml` is unchanged. It still runs the lint/syntax checks and the optional Render deploy hooks. The new workflow deploys to EC2.

## 1. Configure AWS Secrets and project settings

Only the three AWS credentials are kept in GitHub Secrets. Everything else is read from the committed file `.github/deploy-config.env`.

**GitHub Secrets** — Settings → Secrets and variables → Actions → Secrets → New repository secret:

| Name | Value | Needed for |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | Access Key ID from the AWS Academy sandbox (starts with `ASIA`) | CloudFormation, EC2, SSM |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key from the same sandbox | CloudFormation, EC2, SSM |
| `AWS_SESSION_TOKEN` | Session token shown with those temporary keys | Required whenever the access key starts with `ASIA` |

**Project config** — edit `.github/deploy-config.env` and commit it:

| Key | Example / default | Purpose |
| --- | --- | --- |
| `AWS_REGION` | `us-east-2` | Region of your sandbox (the provided session token indicates `us-east-2`) |
| `STACK_NAME` | `fernwell-stack` | CloudFormation stack name |
| `ADMIN_EMAIL` | `admin@fernwell.com` | Email of the first admin user |
| `DB_URL` | `mongodb://127.0.0.1:27017/fernwell` | MongoDB connection string (MongoDB is installed on the EC2 instance by the template) |
| `JWT_SECRET` | output of `openssl rand -hex 32` | Signs login tokens |
| `ADMIN_PASSWORD` | your chosen password | Password for the first admin user |

The workflow refuses to run while any value still says `replace-...`.

Notes:

- AWS Academy sandbox keys are temporary: the access key, secret key, and session token all change together. Start the sandbox and update all three GitHub Secrets together before deploying again. If you paste credentials somewhere public (chat, screenshot, commit), rotate them in the sandbox immediately.
- `DB_URL`, `JWT_SECRET` and `ADMIN_PASSWORD` are also sensitive. Keeping them in a committed file means anyone with repository access can read them. GitHub Secrets are the safer place; if you change your mind, add those three as secrets and restore the `${{ secrets.NAME }}` references in `.github/workflows/deploy-ec2.yml`.
- The template installs MongoDB Community Edition on the instance, so the default `mongodb://127.0.0.1:27017/fernwell` works without Atlas. If you switch to Atlas, add the runner's IP to Atlas Network Access (or allow `0.0.0.0/0` for a student project) and update `DB_URL`.
- The AWS credentials are never written to the repository or the instance.

## 2. Trigger the pipeline

- Push a change to `main` under `backend/`, `frontend/`, `infra/`, or the workflow file, **or**
- Open **Actions → Deploy MERN app to EC2 → Run workflow** and choose an instance type.

The first run takes a few minutes (package installation on a fresh instance). Later runs are faster.

When it finishes, the run summary shows the website URL and the CloudFormation outputs. Open `http://<public-ip>` in a browser and log in as `admin@fernwell.com` with the `ADMIN_PASSWORD` you set.

## 3. Why there is no API URL to configure

The React build is made with `VITE_API_URL=/api`. nginx serves the site at `/` and forwards `/api/*` to the Express API on `127.0.0.1:8000`. That means:

- No hardcoded public IP in the frontend bundle.
- No CORS problem, because the browser sees one origin.
- A changed public IP after a stop/start still works.

The API is generated with `CLIENT_URL=http://<current-public-ip>` in the instance's `.env` so CORS matches the browser address.

## 4. Files added by this pipeline

| File | What it does |
| --- | --- |
| `.github/workflows/deploy-ec2.yml` | Build + deploy workflow (push to `main` or manual) |
| `infra/ec2-app.yaml` | CloudFormation: key pair, security group (22/80), EC2 with nginx + Node, systemd unit for the API |
| `docs/EC2-DEPLOYMENT.md` | This guide |

Nothing in `backend/` or `frontend/` source was changed, so local development (`npm run dev` in both folders) works exactly as before.

## 5. Useful commands

SSH into the instance (from the workflow's `Show outputs` step you can copy the key from SSM; for local SSH use your own key or the AWS console "Connect" button):

```bash
sudo systemctl status fernwell-api     # API process
sudo journalctl -u fernwell-api -n 50  # API logs
sudo tail -f /var/log/nginx/error.log  # nginx errors
curl http://localhost/api/             # should return {"success":true,...}
```

Change app settings by editing `.github/deploy-config.env` and pushing, then run the workflow manually if you want it immediately. Change AWS credentials by updating the three GitHub Secrets and running the workflow manually. The `.env` on the instance is rewritten on every deploy.

Change instance size: run the workflow manually and pick a different `instance_type`, or set the `InstanceType` stack parameter in the CloudFormation console.

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Invalid character in header content ["x-amz-security-token"]` | The session token secret contained a hidden newline. The workflow now trims all three AWS secrets automatically; if it still happens, re-create the secret with a single-line paste. |
| `SignatureDoesNotMatch` / `InvalidClientTokenId` | AWS keys are swapped, have spaces, expired, or the matching `AWS_SESSION_TOKEN` is missing. Copy all three fresh sandbox values together. |
| Workflow stops at "Check AWS secrets and deploy config" | Fill in the `replace-...` values in `.github/deploy-config.env`, or add the missing AWS secret, then run the workflow again. |
| `SSH not ready yet ...` for the full loop | Check the security group allows port 22 from GitHub runners, and that the keys belong to the same sandbox account/region. |
| "UserData failed on the instance" | The log printed in the workflow shows the failing `dnf`/nginx command. Fix the template and re-run. |
| Site loads but API calls fail / 502 | Read the API logs in the failed step. Usually a bad `DB_URL` or Atlas IP allowlist; fix `.github/deploy-config.env` and re-run. |
| Site works, then disappears | The sandbox stopped the instance. The next deploy starts it again. A stopped/started instance can get a new IP, so use the latest URL from the workflow summary. |
| Login fails with the old admin password | `npm run seed` only creates the admin once. Change the password in MongoDB, or delete that admin user and re-run the workflow with a new `ADMIN_PASSWORD`. |
| Want to stop charges | Delete the `fernwell-stack` stack in CloudFormation. This removes the instance, key pair and security group. |

## 7. Region and stack name

Both are set in `.github/deploy-config.env` (`us-east-2` / `fernwell-stack` by default). If you change `STACK_NAME` after a deploy, the old stack stays running — delete it manually when you no longer need it.
