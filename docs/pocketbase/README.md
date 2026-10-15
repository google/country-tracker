# PocketBase Configuration (Default)

PocketBase is the default backend for the Country Tracker application. It provides a lightweight, single-file SQLite database with an embedded storage engine.

## Setup Instructions

### Option 1: Manual Download
1.  **Download PocketBase**: Download the binary for your OS from [pocketbase.io](https://pocketbase.io/).
2.  **Start Server**: Run `./pocketbase serve` to start the server (defaults to `http://127.0.0.1:8090`).
3.  **Admin UI**: Access the admin UI at `http://127.0.0.1:8090/_/` and create your admin account.
4.  **Create Collections**: Create the collections as defined in `SCHEMA.md`.
5.  **Authentication**: PocketBase uses native email/password authentication out of the box. No external configuration is required. Account creation is handled automatically on first login.

### Option 2: Docker
You can spin up PocketBase quickly using Docker:

```bash
docker run -d \
  -p 8090:8090 \
  -v ./pb_data:/pb/pb_data \
  --name pocketbase \
  ghcr.io/muchobien/pocketbase:latest
```

This will start PocketBase and persist data in a local `./pb_data` directory.

## Application Configuration

To use PocketBase as the backend, set the following environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_BACKEND_TYPE="pocketbase"
NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"
```

> [!IMPORTANT]
> You must specify `NEXT_PUBLIC_POCKETBASE_URL`. There is no hardcoded fallback in the application code to ensure explicit configuration.
