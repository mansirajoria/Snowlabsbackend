# Environment Variables & Credentials (Snowlabs Backend)

This document lists the environment variables required to run the Snowlabs backend, and provides step-by-step instructions to create or rotate credentials for each service. Keep secrets out of source control — use your deployment platform's secret manager (Vercel, GitHub Actions secrets, or similar).

## Minimal required variables to run the app
- `NODE_ENV` — `development` or `production` (e.g., `production`)
- `APP_PORT` — e.g., `8008`
- `API_PREFIX` — e.g., `api`
- `DATABASE_TYPE` — `postgres`
- `DATABASE_HOST` — your DB host
- `DATABASE_PORT` — `5432`
- `DATABASE_NAME` — database name
- `DATABASE_USERNAME` — DB username
- `DATABASE_PASSWORD` — DB password
- `AUTH_JWT_SECRET` — long random secret for signing JWTs

## Recommended additional variables (only if using the feature)
- Mail: `MAIL_SERVICE`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_MAIL`, `MAIL_PASSWORD`
- AWS S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`
- Redis: `WORKER_HOST` (e.g., `redis://host:6379/1`)
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` and callback URLs
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY` (if using SendGrid)

---

## Creating credentials (step-by-step)

### 1) Postgres (managed DB or self-hosted)

If using a managed DB (AWS RDS / DigitalOcean / Azure / Heroku):

1. Create a database instance in your provider (choose a strong, unique username and password).
2. Configure the VPC / public access / security group so your Vercel deployment (or a DB proxy) can reach it.
3. Copy the connection details and set these env vars in Vercel: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.
4. For Neon, use the connection details from your Neon project. The backend currently reads the individual `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` variables.

The current TypeORM configuration reads the individual `DATABASE_*` variables above, not `DATABASE_URL`. If you exposed DB credentials earlier, rotate them now from your DB provider console.

### 2) Database migrations

The backend uses TypeORM with PostgreSQL (including Neon). Create and run TypeORM migrations using the `migration:generate` and `migration:run` scripts in `package.json`. Run production migrations as a separate deployment step; Vercel builds only compile the application.

### 3) AWS S3 (file storage)

1. In AWS IAM, create a new user with `Programmatic access`.
2. Attach a policy that gives access only to the specific S3 bucket (least privilege).
3. Save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` and set them in Vercel.
4. Create the S3 bucket and set `AWS_REGION` and `AWS_BUCKET_NAME`.

Rotate keys if they were exposed.

### 4) Email (Gmail or SMTP)

1. For Gmail, create an App Password (recommended) for the sending account and set `MAIL_PASSWORD`.
2. For other SMTP providers, create/send credentials via their console and set `MAIL_HOST`, `MAIL_PORT`, `MAIL_MAIL`, and `MAIL_PASSWORD`.

### 5) OAuth (Google, Facebook, GitHub, LinkedIn)

1. Register your application in the provider console (Google Cloud Console, Facebook Developers, GitHub OAuth Apps, LinkedIn Developer Portal).
2. Add your production authorized redirect URI (e.g., `https://api.snowlabstechnology.com/api/v1/auth/google/callback`) and your local redirect (for development `http://localhost:8008/api/v1/auth/google/callback`).
3. Save `CLIENT_ID` and `CLIENT_SECRET` from the provider and set env vars (e.g., `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

### 6) Stripe

1. In Stripe Dashboard → Developers → API Keys, create a new secret key.
2. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel.

### 7) SendGrid / Other APIs

1. Create an API key in the provider console.
2. Set `SENDGRID_API_KEY` (or corresponding key) in Vercel.

---

## Vercel: How to add environment variables

1. Open your Project in Vercel.
2. Go to Settings → Environment Variables.
3. Add each required key (for example, `DATABASE_HOST`) and its value; choose `Production`, `Preview`, or `Development` scope.

Secrets that must be set on Vercel for Snowlabs backend (suggested list):
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `AUTH_JWT_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_MAIL`, `MAIL_PASSWORD`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`

## Rotating credentials after a leak

1. Revoke the leaked credential in the provider console (GCP, AWS, Stripe, etc.).
2. Create a new key/secret and update your deployment environment variables in Vercel.
3. Validate application behavior and monitor logs.

## Running locally (quick start)

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `npm ci`.
3. Build: `npm run build`.
4. Start locally: `npm run start:dev`.

## Final notes
- Use least privilege for service accounts.
- Use secret rotation regularly and auditing.
- For serverless deployments, use Neon's pooled connection option where appropriate.

If you want, I can add this README file to the repo and commit it; do you want me to commit now? 
