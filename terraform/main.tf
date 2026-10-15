/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * # Core Infrastructure Definition (main.tf)
 * 
 * Orchestrates the full lifecycle of the Country Tracker Google Cloud architecture.
 * This includes bootstrapping the default Compute provider, unlocking necessary REST APIs,
 * provisioning the scalable Cloud Run serverless app, structuring the remote Docker registry,
 * and mapping the Workload Identity Federation (WIF) pipeline for secure GitHub Actions deployments.
 */
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.25.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "project" {}

# Enable Required APIs
locals {
  apis = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iamcredentials.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com"
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each           = toset(local.apis)
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# Base Cloud Run Service (Hello World Starter)
resource "google_cloud_run_v2_service" "web_app" {
  name                = var.service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false # Explicitly disabling for v7.0+ default drift to allow teardowns

  /**
   * CRITICAL LIFECYCLE BYPASS:
   * We intentionally force Terraform to ignore metadata drifts on the underlying container `image` 
   * and injected `env` layers. This explicitly delegates continuous deployment ownership 
   * to the GitHub Actions CI pipeline rather than hardcoding static SHA sums in Terraform state loops.
   */
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].containers[0].env
    ]
  }

  template {
    containers {
      # Initial placeholder image; GitHub Actions will override this on first deploy
      image = "us-docker.pkg.dev/cloudrun/container/hello"
    }
  }

  depends_on = [google_project_service.enabled_apis]
}

# Make Service Publicly Available
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.web_app.name
  location = google_cloud_run_v2_service.web_app.location
  project  = google_cloud_run_v2_service.web_app.project
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Optional Custom Domain Mapping
resource "google_cloud_run_domain_mapping" "custom_domain" {
  count    = var.custom_domain != "" ? 1 : 0
  location = var.region
  name     = var.custom_domain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.web_app.name
  }
}

# Artifact Registry
resource "google_artifact_registry_repository" "nextjs_repo" {
  location      = var.region
  repository_id = var.repository_id
  description   = "Docker repository for Country Tracker Next.js Container"
  format        = "DOCKER"
  depends_on    = [google_project_service.enabled_apis]
}

# GitHub Actions Service Account
resource "google_service_account" "github_actions" {
  account_id   = var.sa_name
  display_name = "GitHub Actions Deployment Service Account"
  project      = var.project_id
}

# Grant necessary deploy roles
resource "google_project_iam_member" "artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "cloud_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant permission to impersonate the Compute Engine default service account
resource "google_service_account_iam_member" "compute_impersonation" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "github_pool" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Identity pool for automated GitHub deployments"
  depends_on                = [google_project_service.enabled_apis]
}

# Workload Identity Provider
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions-provider"
  display_name                       = "GitHub Actions Provider"
  
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }
  
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow specific GitHub repository to impersonate the Service Account
resource "google_service_account_iam_member" "github_impersonation" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"
}
