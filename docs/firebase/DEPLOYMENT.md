# Country Tracker Deployment Guide

This document outlines the CI/CD requirements and Workload Identity Setup needed to safely deploy the `Country Tracker` Next.js application to Google Cloud Run via GitHub Actions.

## 1. Google Cloud Architecture Setup
The architecture relies exclusively on **Cloud Run** coupled with an **Artifact Registry** utilizing Next.js' standalone mode. Secure authentication is handled through **Workload Identity Federation** to completely avoid generating permanent JSON keys.

## 1. Automated Google Cloud Setup (Terraform)
We map all Identity Provisioning and Artifact setup via Infrastructure as Code.

Instead of running verbose `gcloud` IAM commands manually, navigate into to the `/terraform/` directory:

### Step 1: Create a tfvars configuration 
Create a `.tfvars` file (e.g., `terraform.tfvars`) combining your custom parameters. This abstraction allows you to spin up isolated DEV and PROD environments seamlessly!

```env
# terraform/terraform.tfvars

project_id        = "your-gcp-project-id"
region            = "us-central1"
github_repository = "your-github-username/country-tracker"

# Optional Cloud Run Overrides 
service_name      = "country-tracker-web"

# Set this to link a verified custom domain. 
# You will be prompted in the Output to attach a CNAME record to ghs.googlehosted.com.
custom_domain     = "app.country-tracker.com"
```

### Step 2: Provision Infrastructure
Run the following standard terraform protocol locally:
```bash
cd terraform/

terraform init
terraform plan -out=tfplan
terraform apply "tfplan"
```

### Step 3: Extract the GitHub Secrets
Once applied, Terraform automatically prints the `github_secrets_configuration` output block.
Copy and paste those exact values into your GitHub Repository > Settings > Secrets and variables > Actions.

You must configure the following Repository Secrets based on the Terraform output:
1. `GCP_PROJECT_ID`
2. `GCP_REGION`
3. `GCP_ARTIFACT_REPO`
4. `GCP_CLOUD_RUN_SERVICE`
5. `WIF_PROVIDER`
6. `WIF_SERVICE_ACCOUNT`

**Firebase Configuration in GitHub:**
To use Firebase as the backend, you must configure the following Repository Variables in GitHub (Settings > Secrets and variables > Actions > Variables):
- `NEXT_PUBLIC_BACKEND_TYPE`: Set to `firebase`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `COUNTRIES_JSON`: Set to your JSON array of country objects (matching [`config/countries.schema.json`](../../config/countries.schema.json)).

The GitHub Actions workflow (`deploy.yml`) will automatically generate `.env` and `config/countries.json` with these variables during the build process, and Next.js will inline them into the build.

## 4. Deploying Firebase Rules & Indexes (Manual Setup)
While Terraform provisions the GCP infrastructure (Cloud Run, Docker, WIF), **Firestore Security Rules and composite Indexes** must be deployed separately to the project utilizing the official Firebase command-line tools.

1. Install the global Firebase CLI: `npm install -g firebase-tools`
2. Authenticate to your Google account locally: `firebase login`
3. Link your directory to the active Firebase project: `firebase use [YOUR_FIREBASE_PROJECT_ID]`
4. **Deploy Security Rules:** Execute `firebase deploy --only firestore:rules --config docs/firebase/firebase.json` to upload the newly generated locking mechanism automatically.
5. *(Optional) Deploy Indexes:* Composite indexes are natively auto-generated via a hyperlink whenever a complex query errors out in the console. If you populated the `firestore.indexes.json` array natively, you can deploy it sequentially using `firebase deploy --only firestore:indexes --config docs/firebase/firebase.json`.

## 5. Triggering Deployments
With GitHub Secrets loaded, you simply merge a Pull Request into the `main` branch. 
The `.github/workflows/deploy.yml` pipeline will automatically execute, run the Jest tests ensuring perfect stability, compile a `<50MB` Standalone Docker image, and launch it to a public URL on Google Cloud Run.
