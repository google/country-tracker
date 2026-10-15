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

import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Validates required backend environment variables at build/startup time.
 */
function validateConfig() {
  const backendType = process.env.NEXT_PUBLIC_BACKEND_TYPE || 'pocketbase';

  console.log(`[Build Config] Validating configuration for backend: ${backendType}`);

  if (backendType === 'firebase') {
    const required = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for Firebase backend: ${missing.join(', ')}`
      );
    }
  } else if (backendType === 'pocketbase') {
    const required = ['NEXT_PUBLIC_POCKETBASE_URL'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for PocketBase backend: ${missing.join(', ')}`
      );
    }
  } else {
    throw new Error(`Unknown backend type: ${backendType}`);
  }
}

/**
 * Reads and validates the developer-supplied country configuration file at startup/build time.
 * Defaults to an empty array with a clear console warning if no config file is present.
 */
function loadCountriesConfig(): string {
  const configPath = process.env.COUNTRIES_CONFIG_PATH
    ? path.resolve(process.env.COUNTRIES_CONFIG_PATH)
    : path.join(process.cwd(), 'config', 'countries.json');

  if (!fs.existsSync(configPath)) {
    console.warn(
      `[Build Config] Warning: Country configuration file not found at ${configPath}. ` +
        'Starting with an empty country list. Copy config/countries.example.json to config/countries.json to configure destinations.'
    );
    return '[]';
  }

  try {
    const rawContent = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(rawContent);

    if (!Array.isArray(parsed)) {
      throw new Error('Country configuration root must be a JSON array.');
    }

    const sanitized = parsed.map((entry: unknown, index: number) => {
      if (!entry || typeof entry !== 'object') {
        throw new Error(`Invalid country entry at index ${index}: expected an object.`);
      }
      const record = entry as Record<string, unknown>;
      if (typeof record.name !== 'string' || !record.name.trim()) {
        throw new Error(`Invalid country entry at index ${index}: "name" must be a non-empty string.`);
      }
      if (typeof record.code !== 'string' || !/^[A-Za-z]{2}$/.test(record.code.trim())) {
        throw new Error(
          `Invalid country entry at index ${index} ("${record.name}"): "code" must be a 2-letter ISO string.`
        );
      }

      return {
        name: record.name.trim(),
        code: record.code.trim().toUpperCase(),
        cca3: typeof record.cca3 === 'string' ? record.cca3.trim().toUpperCase() : '',
        ccn3: typeof record.ccn3 === 'string' ? record.ccn3.trim() : '',
        region: typeof record.region === 'string' ? record.region.trim() : '',
        capital: typeof record.capital === 'string' ? record.capital.trim() : '',
        ...(typeof record.flag === 'string' && record.flag.trim()
          ? { flag: record.flag.trim() }
          : {}),
      };
    });

    console.log(`[Build Config] Loaded ${sanitized.length} countries from ${configPath}`);
    return JSON.stringify(sanitized);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[Build Config] Failed to load country configuration from ${configPath}: ${message}`);
  }
}

validateConfig();
const countriesJson = loadCountriesConfig();

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_COUNTRIES_JSON: countriesJson,
  },
};

export default nextConfig;
