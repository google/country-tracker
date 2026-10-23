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
 * VisitedCountriesSummary — "Sunlit Passport & Vintage Air Mail" Logbook Summary Card
 *
 * Architectural Rationale:
 * Turns the top summary box into an official Passport & Par Avion logbook header:
 * 1. Top edge features the `.airmail-border` diagonal red-and-navy trim.
 * 2. Displays an automatic Explorer Milestone badge (using the same 24x24 strokeWidth=2
 *    Tabler inline SVG convention as `AppShellLayout.tsx`).
 * 3. Computes a live per-continent breakdown using `getRegionAccent` so travelers can see
 *    their regional footprint alongside their stamped flag collection.
 */

'use client';

import React from 'react';
import { Text, Stack, Card, Progress, Group, Badge, Tooltip, Box } from '@mantine/core';
import { countries, getFlagEmoji, getCountryByCode, filterActiveVisitedCountries } from '@/data/countries';
import { getRegionAccent } from '@/theme';

const CompassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 16 10 10 16 8 14 14 8 16"/><circle cx="12" cy="12" r="9"/></svg>
);

export const getExplorerMilestone = (visitedCount: number): string => {
  if (visitedCount === 0) return 'Passport Ready';
  if (visitedCount < 5) return 'Daytripper';
  if (visitedCount < 15) return 'Continent Hopper';
  if (visitedCount < 35) return 'Jetsetter';
  return 'Globetrotter';
};

interface VisitedCountriesSummaryProps {
  visitedCountries: string[];
}

/** JSDoc
 * Condenses the user target array into comparative baseline metrics displaying total 
 * visited counts alongside percentage-based UI tracker visualization.
 */
const VisitedCountriesSummary: React.FC<VisitedCountriesSummaryProps> = ({ visitedCountries }) => {
  const total = countries.length;
  // Intersect stored visited codes with the active country list so removing a country
  // from config/countries.json never causes visitedCount to exceed total or mismatch flags.
  const activeVisitedCodes = filterActiveVisitedCountries(visitedCountries, countries);
  const visitedCount = activeVisitedCodes.length;
  const percentage = total > 0 ? (visitedCount / total) * 100 : 0;

  // Aggregate visited counts by continent/region for the regional passport breakdown pills
  const regionCounts = activeVisitedCodes.reduce<Record<string, number>>((acc, code) => {
    const country = getCountryByCode(code, countries);
    if (country?.region) {
      acc[country.region] = (acc[country.region] || 0) + 1;
    }
    return acc;
  }, {});

  const regionEntries = Object.entries(regionCounts);

  return (
    <Card shadow="sm" radius="lg" withBorder padding={0} style={{ overflow: 'hidden' }}>
      <div className="airmail-border" />
      <Stack gap="sm" p="xl">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm" align="center">
            <Text
              fw={700}
              size="xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Your Progress
            </Text>
            <Badge
              size="md"
              variant="light"
              color="sunlit-marigold"
              leftSection={<CompassIcon />}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                letterSpacing: '0.6px',
              }}
            >
              {getExplorerMilestone(visitedCount)}
            </Badge>
          </Group>
          <Badge
            size="lg"
            variant="filled"
            color="passport-navy"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              letterSpacing: '0.8px',
            }}
          >
            {visitedCount} / {total}
          </Badge>
        </Group>

        <Progress 
          value={percentage} 
          size="xl" 
          radius="xl" 
          color="postmark-red" 
          striped 
          animated={percentage > 0 && percentage < 100} 
        />
        
        <Group justify="space-between" align="center" wrap="wrap" mt="xs">
          <Text size="sm" c="dimmed">
            You have explored {percentage.toFixed(1)}% of the world. Keep going!
          </Text>

          {regionEntries.length > 0 && (
            <Group gap={6}>
              {regionEntries.map(([region, count]) => {
                const accent = getRegionAccent(region);
                return (
                  <Badge
                    key={region}
                    size="sm"
                    variant="outline"
                    style={{
                      borderColor: accent.hex,
                      color: accent.hex,
                      backgroundColor: `light-dark(${accent.bgLight}, rgba(15, 23, 42, 0.5))`,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    }}
                  >
                    {region}: {count}
                  </Badge>
                );
              })}
            </Group>
          )}
        </Group>

        {visitedCount > 0 && (
          <Box
            mt="sm"
            pt="sm"
            style={{
              borderTop: '1px dashed light-dark(#DFD5C0, #2A3B5C)',
            }}
          >
            <Group gap="xs">
              {activeVisitedCodes.map(code => {
                const country = getCountryByCode(code, countries);
                return country ? (
                  <Tooltip key={code} label={`${country.name} (${country.cca3 || country.code})`} withArrow>
                    <Text style={{ fontSize: '1.8rem', cursor: 'default', lineHeight: 1.1 }}>
                      {getFlagEmoji(code, country.flag)}
                    </Text>
                  </Tooltip>
                ) : null;
              })}
            </Group>
          </Box>
        )}
      </Stack>
    </Card>
  );
};

export default VisitedCountriesSummary;
