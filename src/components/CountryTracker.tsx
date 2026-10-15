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

import React, { useState } from 'react';
import useSWR from 'swr';
import { ServiceRegistry } from '@/lib/services/registry';
import CountryList from './CountryList';

const userRepository = ServiceRegistry.getUserRepository();
import VisitedCountriesSummary from './VisitedCountriesSummary';
import dynamic from 'next/dynamic';

const WorldMap = dynamic(() => import('./WorldMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--mantine-color-gray-1)', borderRadius: 'var(--mantine-radius-lg)' }}>
      <Loader size="lg" color="digital-atlas-cyan" />
    </div>
  )
});
import { Loader, Center, Text, Stack, Button, Tabs } from '@mantine/core';

interface CountryTrackerProps {
  userId: string;
}

/** JSDoc
 * Core application container managing the bidirectional sync between the UI and user's country array.
 * Uses optimistic UI updates backed by SWR cache manipulation to ensure the UI responds
 * instantaneously while verifying and settling data against the backend in the background.
 */
const CountryTracker: React.FC<CountryTrackerProps> = ({ userId }) => {
  // Sync the cached user array. Key must be explicitly nullified if no UID exists yet to halt fetching.
  const { 
    data: visitedCountries, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    userId ? `visited-countries-${userId}` : null,
    () => userRepository.getVisitedCountries(userId)
  );

  const [actionError, setActionError] = useState<string | null>(null);

  /** JSDoc
   * Toggles the presence of a target country code in the user's list.
   * Modifies SWR state first for immediate UI response, then dispatches the update to the server.
   */
  const toggleCountry = async (countryCode: string) => {
    if (!visitedCountries) return;
    
    setActionError(null);
    const isVisited = visitedCountries.includes(countryCode);
    
    // Evaluate the anticipated resulting array locally.
    const newCountries = isVisited 
      ? visitedCountries.filter((c: string) => c !== countryCode)
      : [...visitedCountries, countryCode];
    
    // Optimistic update: Update the SWR cache without triggering an immediate revalidate ping.
    mutate(newCountries, false);
    
    try {
      // Execute genuine backend modification safely
      if (isVisited) {
        await userRepository.removeVisitedCountry(userId, countryCode);
      } else {
        await userRepository.addVisitedCountry(userId, countryCode);
      }
      // Re-fetch to guarantee the local array is accurately synchronized with the definitive backend state.
      mutate();
    } catch (err: any) {
      console.error('Error toggling country:', err);
      setActionError('Failed to update. Reverting changes.');
      // Rollback optimistic update on failure by re-syncing SWR to raw origin payload
      mutate();
    }
  };

  if (isLoading) {
    return (
      <Center>
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Stack gap="sm">
        <Text c="red" fw={500}>{error.message || 'Failed to fetch visited countries.'}</Text>
        <Button variant="outline" onClick={() => mutate()}>Retry</Button>
      </Stack>
    );
  }

  const countries = visitedCountries || [];

  return (
    <Stack gap="xl">
      {actionError && <Text c="red" fw={500} ta="center">{actionError}</Text>}
      
      <VisitedCountriesSummary visitedCountries={countries} />
      
      <Tabs defaultValue="list" variant="pills" radius="md">
        <Tabs.List grow justify="center" mb="lg">
          <Tabs.Tab value="list" style={{ fontSize: '1rem', fontWeight: 600 }}>List View</Tabs.Tab>
          <Tabs.Tab value="map" style={{ fontSize: '1rem', fontWeight: 600 }}>Map View</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list">
          <CountryList
            visitedCountries={countries}
            onToggleCountry={toggleCountry}
          />
        </Tabs.Panel>

        <Tabs.Panel value="map">
          <WorldMap visitedCountries={countries} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default CountryTracker;
