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
 * # Infrastructure Outputs (outputs.tf)
 * 
 * Exposes securely mapped deployment values to the console terminal post-apply.
 * This file strictly outputs the required runtime secrets needed by the GitHub Actions 
 * pipeline to successfully target and authenticate with the newly generated GCP infrastructure.
 */
output "artifact_registry_address" {
  description = "The absolute URI for the Docker registry you should target in CI/CD"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.nextjs_repo.repository_id}"
}

output "github_actions_service_account_email" {
  description = "Set this value inside GitHub Secret 'WIF_SERVICE_ACCOUNT'"
  value       = google_service_account.github_actions.email
}

output "workload_identity_provider_name" {
  description = "Set this value inside GitHub Secret 'WIF_PROVIDER'"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}

output "cloud_run_url" {
  description = "The automatically assigned Cloud Run public URL"
  value       = google_cloud_run_v2_service.web_app.uri
}

output "custom_domain_cname_record" {
  description = "If you mapped a custom domain, point its CNAME record to the Cloud Run URL."
  value       = var.custom_domain != "" ? "Map CNAME for ${var.custom_domain} -> ghs.googlehosted.com" : "No custom domain configured."
}

output "github_secrets_configuration" {
  description = "COPY AND PASTE THIS EXACT BLOCK INTO GITHUB REPOSITORY SECRETS:"
  value       = <<EOF
=========================================================
GITHUB REPOSITORY SECRETS
---------------------------------------------------------
Add these explicit configurations to your GitHub Secrets
under 'Settings' -> 'Secrets and variables' -> 'Actions':

GCP_PROJECT_ID        = ${var.project_id}
GCP_REGION            = ${var.region}
GCP_ARTIFACT_REPO     = ${google_artifact_registry_repository.nextjs_repo.repository_id}
GCP_CLOUD_RUN_SERVICE = ${google_cloud_run_v2_service.web_app.name}
WIF_PROVIDER          = ${google_iam_workload_identity_pool_provider.github_provider.name}
WIF_SERVICE_ACCOUNT   = ${google_service_account.github_actions.email}
=========================================================
EOF
}
