# PocketBase & Frontend Deployment Guide

This document outlines the strategy for deploying the Country Tracker application using PocketBase as the backend and Google Cloud Run for the frontend.

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

You can reuse the existing Google Cloud Run setup for the frontend! The only difference is the environment variables.

### Step 1: Update GitHub Variables

To deploy the frontend connected to PocketBase, configure the following Repository Variables in GitHub (Settings > Secrets and variables > Actions > Variables):

-   `NEXT_PUBLIC_BACKEND_TYPE`: Set to `pocketbase` (optional, as it is the default).
-   `NEXT_PUBLIC_POCKETBASE_URL`: Set to your deployed PocketBase instance URL (e.g., `https://your-pocketbase-app.fly.dev`).
-   `COUNTRIES_JSON`: Set to your JSON array of country objects (matching [`config/countries.schema.json`](../../config/countries.schema.json)). The workflow writes this to `config/countries.json` before building the container.

The GitHub Actions workflow (`deploy.yml`) will automatically generate `.env` and `config/countries.json` with these variables during the build process, and Next.js will inline them into the build.

### Step 2: Deploy Via GitHub Actions

The workflow in `.github/workflows/deploy.yml` will build and deploy the standalone Next.js image to Cloud Run. Ensure the GCP secrets are also updated as described in the main deployment documentation.
