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

'use client';

import React from 'react';
import { Text, Stack, Card, Progress, Group, Badge, Tooltip } from '@mantine/core';
import { countries, getFlagEmoji, getCountryByCode, filterActiveVisitedCountries } from '@/data/countries';

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

  return (
    <Card shadow="sm" radius="md" withBorder padding="xl">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700} size="xl">Your Progress</Text>
          <Badge size="lg" variant="light" color="digital-atlas-cyan">
            {visitedCount} / {total}
          </Badge>
        </Group>

        <Progress 
          value={percentage} 
          size="xl" 
          radius="xl" 
          color="digital-atlas-cyan" 
          striped 
          animated={percentage > 0 && percentage < 100} 
        />
        
        <Text size="sm" c="dimmed" mt="xs">
          You have explored {percentage.toFixed(1)}% of the world. Keep going!
        </Text>

        {visitedCount > 0 && (
          <Group gap="xs" mt="md">
            {activeVisitedCodes.map(code => {
              const country = getCountryByCode(code, countries);
              return country ? (
                <Tooltip key={code} label={country.name} withArrow>
                  <Text style={{ fontSize: '1.8rem', cursor: 'default' }}>
                    {getFlagEmoji(code, country.flag)}
                  </Text>
                </Tooltip>
              ) : null;
            })}
          </Group>
        )}
      </Stack>
    </Card>
  );
};

export default VisitedCountriesSummary;
