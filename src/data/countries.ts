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

export interface Country {
  name: string;
  code: string;
  cca3: string;
  ccn3: string;
  region: string;
  capital: string;
  flag?: string;
}

/**
 * Generates a Unicode Regional Indicator flag emoji from any 2-letter ASCII country code,
 * or returns an explicit custom flag override if provided in the country configuration.
 */
export const getFlagEmoji = (countryCode: string, customFlag?: string): string => {
  if (customFlag && customFlag.trim().length > 0) {
    return customFlag.trim();
  }
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode.trim())) {
    return '🏳️';
  }
  const codePoints = countryCode
    .trim()
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Safely parses and normalizes a serialized JSON country array into validated Country objects.
 * Returns an empty array if the input is absent or malformed so the application never crashes.
 */
export const parseCountriesConfig = (rawJson?: string): Country[] => {
  if (!rawJson || !rawJson.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => {
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        return (
          typeof record.name === 'string' &&
          record.name.trim().length > 0 &&
          typeof record.code === 'string' &&
          /^[A-Za-z]{2}$/.test(record.code.trim())
        );
      })
      .map((record) => ({
        name: (record.name as string).trim(),
        code: (record.code as string).trim().toUpperCase(),
        cca3: typeof record.cca3 === 'string' ? record.cca3.trim().toUpperCase() : '',
        ccn3: typeof record.ccn3 === 'string' ? record.ccn3.trim() : '',
        region: typeof record.region === 'string' ? record.region.trim() : '',
        capital: typeof record.capital === 'string' ? record.capital.trim() : '',
        ...(typeof record.flag === 'string' && record.flag.trim().length > 0
          ? { flag: record.flag.trim() }
          : {}),
      }));
  } catch {
    return [];
  }
};

/**
 * The active list of countries loaded once at module initialization from the developer-supplied configuration.
 */
export const countries: Country[] = parseCountriesConfig(process.env.NEXT_PUBLIC_COUNTRIES_JSON);

/**
 * Precomputed O(1) lookup Map keyed by 2-letter uppercase country code.
 * Initialized once at startup to avoid repeated O(N) array scans and Set allocations during rendering.
 */
export const countriesByCode: ReadonlyMap<string, Country> = new Map(
  countries.map((country) => [country.code, country])
);

/**
 * Retrieves a Country object by its 2-letter code in O(1) time using the precomputed Map
 * when querying the default countries list, or falls back to array lookup when a custom list is provided.
 */
export const getCountryByCode = (
  code: string,
  activeCountries: Country[] = countries
): Country | undefined => {
  if (!code) {
    return undefined;
  }
  if (activeCountries === countries && countriesByCode.size === countries.length) {
    return countriesByCode.get(code);
  }
  return activeCountries.find((c) => c.code === code);
};

/**
 * Filters a user's stored visited country codes against the currently active country list.
 * Uses the precomputed O(1) countriesByCode Map when validating against the default country list
 * to avoid allocating a new Set on every call.
 */
export const filterActiveVisitedCountries = (
  visitedCodes: string[] = [],
  activeCountries: Country[] = countries
): string[] => {
  if (!Array.isArray(visitedCodes) || visitedCodes.length === 0) {
    return [];
  }
  if (activeCountries === countries && countriesByCode.size === countries.length) {
    return visitedCodes.filter((code) => countriesByCode.has(code));
  }
  const activeCodeSet = new Set(activeCountries.map((c) => c.code));
  return visitedCodes.filter((code) => activeCodeSet.has(code));
};