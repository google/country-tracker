# Country Tracker Deployment Guide (Firebase + Cloud Run)

This document outlines how to manually build and deploy the `Country Tracker` Next.js application to Google Cloud Run when using Firebase as your backend.

> [!NOTE]
> The repository's GitHub Actions workflow (`.github/workflows/ci.yml`) only runs automated code checks and tests on pull requests and pushes to `main`. It does not perform automated deployments.

## 1. Provision Google Cloud Infrastructure (Optional Terraform Setup)
The `/terraform/` directory contains optional Infrastructure-as-Code definitions to provision an Artifact Registry repository and a Cloud Run service in your Google Cloud project.

### Step 1: Create a `.tfvars` configuration
Create `terraform/terraform.tfvars` with your project parameters:

```hcl
# terraform/terraform.tfvars

project_id        = "your-gcp-project-id"
region            = "us-central1"
github_repository = "your-github-username/country-tracker"

# Optional Cloud Run Overrides
service_name      = "country-tracker-web"

# Optional custom domain
custom_domain     = ""
```

### Step 2: Apply Terraform Configuration
```bash
cd terraform/
terraform init
terraform plan -out=tfplan
terraform apply "tfplan"
```

## 2. Configure Build Environment & Country List
Before building the production container image, create a `.env` file in the project root with your Firebase configuration and ensure `config/countries.json` is populated (matching [`config/countries.schema.json`](../../config/countries.schema.json)):

```env
NEXT_PUBLIC_BACKEND_TYPE=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Next.js will validate and inline these variables alongside `config/countries.json` during `docker build`.

## 3. Build and Deploy to Cloud Run
Authenticate with Google Cloud, build the standalone Next.js container image, push it to Artifact Registry, and deploy to Cloud Run:

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

## 4. Deploying Firebase Rules & Indexes
Firestore Security Rules and composite indexes are deployed separately using the Firebase CLI:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Authenticate locally: `firebase login`
3. Link your Firebase project: `firebase use [YOUR_FIREBASE_PROJECT_ID]`
4. **Deploy Security Rules:** Execute `firebase deploy --only firestore:rules --config docs/firebase/firebase.json`.
5. **Deploy Indexes (Optional):** Execute `firebase deploy --only firestore:indexes --config docs/firebase/firebase.json`.
