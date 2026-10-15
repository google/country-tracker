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

import {
  countries,
  countriesByCode,
  getCountryByCode,
  getFlagEmoji,
  parseCountriesConfig,
  filterActiveVisitedCountries,
  Country,
} from '@/data/countries';

describe('Countries Configuration & Utilities', () => {
  it('should default countries to an array and countriesByCode to a Map when no configuration is injected', () => {
    expect(Array.isArray(countries)).toBe(true);
    expect(countriesByCode instanceof Map).toBe(true);
  });

  describe('parseCountriesConfig', () => {
    it('should parse and normalize valid country JSON entries', () => {
      const raw = JSON.stringify([
        {
          name: ' Atlantis ',
          code: 'at',
          cca3: 'atl',
          ccn3: '001',
          region: 'Oceanic',
          capital: 'Poseidonis',
          flag: '🔱',
        },
        {
          name: 'El Dorado',
          code: 'ED',
        },
      ]);

      const parsed = parseCountriesConfig(raw);
      expect(parsed).toEqual([
        {
          name: 'Atlantis',
          code: 'AT',
          cca3: 'ATL',
          ccn3: '001',
          region: 'Oceanic',
          capital: 'Poseidonis',
          flag: '🔱',
        },
        {
          name: 'El Dorado',
          code: 'ED',
          cca3: '',
          ccn3: '',
          region: '',
          capital: '',
        },
      ]);
    });

    it('should filter out malformed entries and return empty array on invalid JSON', () => {
      expect(parseCountriesConfig('')).toEqual([]);
      expect(parseCountriesConfig('not-json')).toEqual([]);
      expect(parseCountriesConfig('{"not": "an-array"}')).toEqual([]);

      const mixed = JSON.stringify([
        { name: '', code: 'AT' },
        { name: 'Invalid Code', code: 'ABC' },
        { name: 'Valid Place', code: 'VP' },
      ]);
      expect(parseCountriesConfig(mixed)).toHaveLength(1);
      expect(parseCountriesConfig(mixed)[0].code).toBe('VP');
    });
  });

  describe('getFlagEmoji', () => {
    it('should generate Unicode Regional Indicator emojis for any 2-letter ASCII code', () => {
      expect(getFlagEmoji('AT')).toBe('🇦🇹');
      expect(getFlagEmoji('ed')).toBe('🇪🇩');
    });

    it('should return the custom flag override when provided', () => {
      expect(getFlagEmoji('AT', '🔱')).toBe('🔱');
    });

    it('should return a neutral fallback flag for invalid codes', () => {
      expect(getFlagEmoji('')).toBe('🏳️');
      expect(getFlagEmoji('INVALID')).toBe('🏳️');
      expect(getFlagEmoji('12')).toBe('🏳️');
    });
  });

  describe('getCountryByCode & filterActiveVisitedCountries', () => {
    const activeList: Country[] = [
      { name: 'Atlantis', code: 'AT', cca3: 'ATL', ccn3: '001', region: 'Oceanic', capital: 'Poseidonis' },
      { name: 'El Dorado', code: 'ED', cca3: 'ELD', ccn3: '002', region: 'Mythic', capital: 'Manoa' },
    ];

    it('should look up countries by code and return undefined for unknown or empty codes', () => {
      expect(getCountryByCode('AT', activeList)?.name).toBe('Atlantis');
      expect(getCountryByCode('UNKNOWN', activeList)).toBeUndefined();
      expect(getCountryByCode('', activeList)).toBeUndefined();
    });

    it('should retain only visited codes that exist in the active country configuration', () => {
      // Simulate user having visited 'XX' before it was removed from config/countries.json
      const storedVisited = ['AT', 'XX', 'ED'];
      expect(filterActiveVisitedCountries(storedVisited, activeList)).toEqual(['AT', 'ED']);
    });

    it('should return an empty array when visitedCodes or activeCountries is empty', () => {
      expect(filterActiveVisitedCountries([], activeList)).toEqual([]);
      expect(filterActiveVisitedCountries(['AT'], [])).toEqual([]);
    });
  });
});
