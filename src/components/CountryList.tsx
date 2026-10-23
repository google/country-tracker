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
 * CountryList — Destination Grid & Vintage Postmark Stamp Cards
 *
 * Architectural Rationale:
 * 1. Celebrates Visited Cards (No Dimming): Previously, visited cards were faded to `opacity: 0.7`
 *    with a centered cyan stamp blocking the country name. Now, visited cards remain at 100%
 *    opacity on a warm sunlit surface with a continent-colored border and left spine accent.
 * 2. Continent Color-Coding & Varied Postmarks: Each card resolves its continent ink via
 *    `getRegionAccent(country.region)` and computes a deterministic hand-stamped rotation angle
 *    from its ISO code so a grid of visited destinations looks like an authentic passport page.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SimpleGrid, Card, Text, Checkbox, TextInput, Group, Badge, Stack } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { countries, getFlagEmoji } from '@/data/countries';
import { getRegionAccent } from '@/theme';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3 -4.3"/></svg>
);

/**
 * Computes a deterministic hand-stamped rotation angle (-12deg to -4deg) from a 2-letter code
 * so stamps look organically placed without causing SSR/CSR hydration mismatches.
 */
const getStampRotation = (code: string): number => {
  if (!code || code.length < 2) return -8;
  const hash = code.charCodeAt(0) * 7 + code.charCodeAt(1) * 13;
  return -12 + (hash % 9);
};

interface CountryListProps {
  visitedCountries: string[];
  onToggleCountry: (countryCode: string) => void;
}

/** JSDoc
 * Renders the primary grid-based interaction paradigm for selecting visited countries.
 * Uses a pseudo-virtualized infinite scroll hook (`useIntersection`) to progressively load
 * complex DOM flag elements, keeping the initial render cycle blazing fast.
 */
const CountryList: React.FC<CountryListProps> = ({ visitedCountries, onToggleCountry }) => {
  const [search, setSearch] = useState('');
  const [recentlyStamped, setRecentlyStamped] = useState<string | null>(null);

  // Apply case-insensitive full-text evaluation on the entire underlying data dictionary
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(search.toLowerCase()) || 
    country.region?.toLowerCase().includes(search.toLowerCase()) ||
    country.capital?.toLowerCase().includes(search.toLowerCase())
  );

  const [displayCount, setDisplayCount] = useState(24);
  // Establish an intersection observer target element to track scroll bounds
  const { ref, entry } = useIntersection({
    root: null,
    threshold: 0.1,
  });

  // Incrementally render chunked components down the DOM tree as the user hits the threshold
  useEffect(() => {
    if (entry?.isIntersecting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayCount((prev) => Math.min(prev + 24, filteredCountries.length));
    }
  }, [entry?.isIntersecting, filteredCountries.length]);

  // Reset the progressive loading cursor back to base whenever the filter term changes natively
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayCount(24);
  }, [search]);

  const displayedCountries = filteredCountries.slice(0, displayCount);

  /** JSDoc
   * Triggers the upward callback to optimistically mutate the SWR cache while 
   * rapidly appending ephemeral DOM classes to simulate a "stamp" visual drop.
   */
  const handleToggle = (code: string) => {
    if (!visitedCountries.includes(code)) {
      // Trigger animation for new visits
      setRecentlyStamped(code);
      setTimeout(() => {
        setRecentlyStamped(prev => prev === code ? null : prev);
      }, 1000);
    }
    onToggleCountry(code);
  };

  return (
    <>
      <Group justify="space-between" mb="md" mt="xl">
        <Text
          fw={700}
          size="xl"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Destinations
        </Text>
        <TextInput
          placeholder="Search country, capital, or region..."
          leftSection={<SearchIcon />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flexGrow: 1, maxWidth: 320 }}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
        {displayedCountries.map((country) => {
          const isVisited = visitedCountries.includes(country.code);
          const isJustStamped = recentlyStamped === country.code;
          const accent = getRegionAccent(country.region);
          const stampRotation = getStampRotation(country.code);
          
          return (
            <Card 
              key={country.code} 
              className="country-card"
              withBorder 
              shadow="sm" 
              padding="lg" 
              radius="md"
              style={{ 
                cursor: 'pointer',
                borderColor: isVisited ? accent.hex : undefined,
                borderLeft: isVisited ? `4px solid ${accent.hex}` : undefined,
                backgroundColor: isVisited
                  ? `light-dark(${accent.bgLight}, #1B2945)`
                  : 'light-dark(#FFFDF9, #16213A)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => handleToggle(country.code)}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xl" style={{ fontSize: '2.5rem', lineHeight: 1, flexShrink: 0 }}>
                    {getFlagEmoji(country.code, country.flag)}
                  </Text>
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text
                      fw={700}
                      size="md"
                      lineClamp={1}
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {country.name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {country.capital || 'N/A'}
                    </Text>
                    <Group gap={6} mt={4} wrap="wrap">
                      {country.region && (
                        <Badge
                          size="xs"
                          variant={isVisited ? 'filled' : 'outline'}
                          style={{
                            backgroundColor: isVisited ? accent.hex : 'transparent',
                            borderColor: accent.hex,
                            color: isVisited ? '#FFFDF9' : accent.hex,
                            alignSelf: 'flex-start',
                          }}
                        >
                          {country.region}
                        </Badge>
                      )}
                      {country.cca3 && (
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.68rem',
                            letterSpacing: '0.8px',
                          }}
                        >
                          {country.cca3}
                        </Text>
                      )}
                    </Group>
                  </Stack>
                </Group>
                <Checkbox
                  checked={isVisited}
                  onChange={() => {}} // handled by card click
                  tabIndex={-1}
                  color="passport-navy"
                  radius="xl"
                  size="md"
                  mt={4}
                  style={{ pointerEvents: 'none', flexShrink: 0 }}
                />
              </Group>

              {isVisited && (
                <div
                  className={`passport-stamp ${isJustStamped ? 'animating' : ''}`}
                  style={
                    {
                      '--stamp-color': accent.hex,
                      '--stamp-rotate': `${stampRotation}deg`,
                    } as React.CSSProperties
                  }
                >
                  ★ {country.cca3 ? `${country.cca3} ` : ''}VISITED
                </div>
              )}
            </Card>
          );
        })}
      </SimpleGrid>
      
      {countries.length === 0 ? (
        <Card withBorder radius="md" padding="xl" mt="xl" ta="center">
          <Stack gap="xs" align="center">
            <Text fw={600} size="lg">No Country List Configured</Text>
            <Text c="dimmed" size="sm" maw={520}>
              To populate destinations, create <code>config/countries.json</code> (you can copy <code>config/countries.example.json</code> as a starting template) and restart or redeploy the application.
            </Text>
          </Stack>
        </Card>
      ) : (
        filteredCountries.length === 0 && (
          <Text c="dimmed" ta="center" mt="xl">No countries found matching your search.</Text>
        )
      )}

      {displayedCountries.length < filteredCountries.length && (
        <div ref={ref} style={{ height: '40px', width: '100%' }} />
      )}
    </>
  );
};

export default CountryList;
