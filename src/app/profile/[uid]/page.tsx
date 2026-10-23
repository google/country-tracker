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

import React, { use } from 'react';
import useSWR from 'swr';
import { Title, Container, Card, Stack, Text, Loader, Center, Group, Avatar, Button, Badge } from '@mantine/core';
import { useAuth } from '@/lib/AuthContext';
import { fetchPublicProfile } from '@/app/actions/profile';
import WorldMap from '@/components/WorldMap';
import { countries, getFlagEmoji, getCountryByCode } from '@/data/countries';
import { getRegionAccent } from '@/theme';
import Link from 'next/link';

/** JSDoc
 * Interrogates and displays an isolated snapshot of another traveler's stats.
 * Wraps responses with graceful fallbacks mitigating brute-force visibility exceptions
 * thrown by strictly enforced server-side rules.
 */
export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const targetUid = resolvedParams.uid;
  const { user, loading: authLoading } = useAuth();
  
  // Delegate core retrieval to the securely bounded server action ensuring clientside safety constraints
  const { data: response, isLoading: isProfileLoading, error } = useSWR(
    !authLoading ? `profile-${targetUid}-${user?.uid || 'anon'}` : null,
    () => fetchPublicProfile(targetUid, user?.uid)
  );

  if (isProfileLoading || authLoading) {
    return <Center py="xl"><Loader size="xl" /></Center>;
  }

  const errorStatus = response?.error || (error ? "server_error" : null);
  const profile = response && !response.error ? response : null;

  if (errorStatus === 'private') {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Card withBorder shadow="sm" radius="md" padding="xl" maw={400} ta="center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--mantine-color-red-6)' }}><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"/><path d="M8 11v-4a4 4 0 1 1 8 0v4"/></svg>
            <Title order={3} mt="md">Profile is Private</Title>
            <Text c="dimmed" mt="sm">This traveler's passport is hidden or explicitly locked to Travel Mates only.</Text>
            {user ? (
              <Button component={Link} href="/" mt="xl" fullWidth>Go to my Tracker</Button>
            ) : (
              <Button component={Link} href="/login" mt="xl" fullWidth>Sign in to view</Button>
            )}
          </Card>
        </Center>
      </Container>
    );
  }

  if (errorStatus === 'not_found' || !profile) {
    return (
      <Container size="sm" py="xl">
        <Title order={2} ta="center" c="red">Traveler Not Found</Title>
      </Container>
    );
  }

  // Identify Country Meta using O(1) Map lookup
  const visitedCountries = profile.visitedCountries || [];
  const fullVisitedData = visitedCountries.map((cCode: string) => {
    return getCountryByCode(cCode, countries);
  }).filter(Boolean);

  return (
    <Container size="lg" py="xl">
      <Card withBorder shadow="sm" radius="lg" padding={0} mb="xl" style={{ overflow: 'hidden' }}>
        <div className="airmail-border" />
        <div style={{ padding: 'var(--mantine-spacing-xl)' }}>
          <Group justify="space-between" align="flex-start">
            <Group align="center">
              <Avatar src={profile.photoURL} radius="50%" size="xl" color="passport-navy" name={profile.displayName} />
              <Stack gap={2}>
                <Title order={2}>{profile.displayName}'s Passport</Title>
                <Text c="dimmed">{profile.isOwner ? "This is your public profile." : "Public Travel Profile"}</Text>
              </Stack>
            </Group>
            <Stack align="center" gap={0}>
               <Text
                 size="3rem"
                 fw={900}
                 c="postmark-red.5"
                 style={{
                   lineHeight: 1,
                   fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                 }}
               >
                {fullVisitedData.length}
               </Text>
               <Text fw={600} tt="uppercase" size="xs" c="dimmed" style={{ letterSpacing: '1px' }}>
                  {fullVisitedData.length === 1 ? 'Country' : 'Countries'} Visited
               </Text>
            </Stack>
          </Group>

          {profile.isOwner && (
            <Group mt="xl">
               <Button variant="light" color="digital-atlas-cyan" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Profile Link Copied to clipboard!");
               }}>
                 Copy Public Link 🔗
               </Button>
               <Button component={Link} href="/settings" variant="subtle" color="gray">
                 Edit Privacy
               </Button>
            </Group>
          )}
        </div>
      </Card>

      <Card withBorder shadow="sm" radius="lg" padding="xl" mb="xl">
        <Title order={3} mb="lg">World Map</Title>
        <WorldMap visitedCountries={visitedCountries} />
      </Card>

      <Card withBorder shadow="sm" radius="lg" padding="xl">
         <Title order={3} mb="lg">Visited Collection</Title>
         {fullVisitedData.length === 0 ? (
           <Text c="dimmed">This passport is empty right now.</Text>
         ) : (
           <Group gap="sm">
             {fullVisitedData.map((c: any) => {
                const accent = getRegionAccent(c.region);
                return (
                  <Badge 
                    key={c.code} 
                    size="xl" 
                    variant="outline" 
                    style={{
                      borderColor: accent.hex,
                      color: accent.hex,
                      backgroundColor: `light-dark(${accent.bgLight}, rgba(15, 23, 42, 0.5))`,
                    }}
                    leftSection={<span style={{ fontSize: '1.2rem' }}>{getFlagEmoji(c.code, c.flag)}</span>}
                  >
                    {c.name}
                  </Badge>
                );
             })}
           </Group>
         )}
      </Card>

    </Container>
  );
}
