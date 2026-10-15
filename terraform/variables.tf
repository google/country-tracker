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
 * # Variable Manifest (variables.tf)
 * 
 * Defines the strongly typed parameterized inputs dynamically required by main.tf 
 * allowing developers to spin up separate staging/production clusters without modifying core syntax.
 */
variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources, e.g., us-central1"
  type        = string
  default     = "us-central1"
}

variable "github_repository" {
  description = "The target GitHub repository allowing deployments, spanning username and slug (e.g. your-github-username/country-tracker)"
  type        = string
}

variable "repository_id" {
  description = "The name of the Artifact Registry Docker repository"
  type        = string
  default     = "country-tracker-repo"
}

variable "sa_name" {
  description = "The ID designation of the Service Account responsible for GitHub Actions"
  type        = string
  default     = "github-actions-sa"
}

variable "service_name" {
  description = "The name of the Cloud Run service to provision"
  type        = string
  default     = "country-tracker-web"
}

variable "custom_domain" {
  description = "Optional custom domain to map exclusively to the Cloud Run service (e.g., app.country-tracker.com). Leave empty to use default run.app URL."
  type        = string
  default     = ""
}
