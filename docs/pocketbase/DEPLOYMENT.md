# PocketBase & Frontend Deployment Guide

This document outlines the strategy for deploying the Country Tracker application using PocketBase as the backend and Google Cloud Run (or any container host) for the frontend.

> [!NOTE]
> The repository's GitHub Actions workflow (`.github/workflows/ci.yml`) only runs automated code checks and tests on pull requests and pushes to `main`. It does not perform automated deployments.

## 1. PocketBase Deployment (Backend)

PocketBase is a single active-file executable, which means it requires persistent storage for its SQLite database (`pb_data`).

### Option A: Fly.io (Recommended)

Fly.io is an excellent choice for PocketBase because it supports persistent volumes and simplifies deployment.

1.  **Install Fly CLI**: Follow instructions on [fly.io](https://fly.io/).
2.  **Initialize App**: Run `fly launch` in a directory with the following `Dockerfile`:

```dockerfile
FROM alpine:latest
ARG PB_VERSION=0.22.6
RUN apk add --no-cache unzip ca-certificates
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/
EXPOSE 8080
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
```

3.  **Attach Volume**: Ensure you allocate a persistent volume (e.g., 1GB) and mount it to `/pb/pb_data` in your `fly.toml`.
4.  **Deploy**: Run `fly deploy`.

### Option B: Generic VPS (DigitalOcean, Linode, etc.)

1.  **SSH into VPS**.
2.  **Download and Extract** PocketBase as described in the [Setup Guide](./README.md).
3.  **Run as Systemd Service** to ensure it stays alive:
    -   Create `/etc/systemd/system/pocketbase.service` pointing to your executable and data directory.

---

## 2. Next.js Deployment (Frontend on Cloud Run)

### Step 1: Configure Build Environment & Country List

Before building the frontend container image, create a `.env` file in the project root and populate `config/countries.json` (matching [`config/countries.schema.json`](../../config/countries.schema.json)):

```env
NEXT_PUBLIC_BACKEND_TYPE=pocketbase
NEXT_PUBLIC_POCKETBASE_URL=https://your-pocketbase-app.fly.dev
```

Next.js will inline these variables and your `config/countries.json` file during the container build stage.

### Step 2: Build and Deploy Container Image

Build the standalone Next.js Docker image and deploy it to Cloud Run:

```bash
NODE_VERSION=$(cat .nvmrc | tr -d 'v\n')
IMAGE_URI="us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/country-tracker-repo/country-tracker-web:latest"

docker build --build-arg NODE_VERSION="${NODE_VERSION}" --tag "${IMAGE_URI}" .
docker push "${IMAGE_URI}"

gcloud run deploy country-tracker-web \
  --image "${IMAGE_URI}" \
  --region us-central1 \
  --allow-unauthenticated
```
