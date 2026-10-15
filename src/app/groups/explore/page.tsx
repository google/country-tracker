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

import React, { useState, useEffect } from 'react';
import { Title, Container, Card, Button, Group, Stack, Text, Center, TextInput, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ServiceRegistry } from '@/lib/services/registry';
import { GroupData } from '@/lib/services/interfaces';

const groupRepository = ServiceRegistry.getGroupRepository();

const GlobeIcon = () => (
  <svg style={{ verticalAlign: 'middle', marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1 -4 10 15.3 15.3 0 0 1 -4 -10 15.3 15.3 0 0 1 4 -10z"/><path d="M2 12h20"/></svg>
);

const LockIcon = () => (
  <svg style={{ verticalAlign: 'middle', marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M12 16v1"/><path d="M8 11v-4a4 4 0 0 1 8 0v4"/></svg>
);

/** JSDoc
 * Operates the Public Exploration router allowing arbitrary players to join open directories natively.
 * Implements a cursor-driven pagination architecture to infinitely load matching groups utilizing
 * a 400ms debouncer hook to throttle explicit text-based queries against the backend.
 */
export default function ExploreGroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, 400);
  
  const [results, setResults] = useState<GroupData[]>([]);
  const [searching, setSearching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  
  const [nextCursor, setNextCursor] = useState<any>(null);

  const { data: myGroups = [] } = useSWR(
    user ? `user-groups-${user.uid}` : null,
    () => groupRepository.getUserGroups(user!.uid)
  );

  const myGroupIds = new Set(myGroups.map(g => g.id));

  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      setSearching(true);
      try {
        const { groups, nextCursor: cursor } = await groupRepository.searchPublicGroups(debouncedSearch.trim(), 10, null);
        if (active) {
          setResults(groups);
          setNextCursor(cursor);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        if (active) setSearching(false);
      }
    };
    
    fetchInitial();
    return () => { active = false; };
  }, [debouncedSearch]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const { groups, nextCursor: newCursor } = await groupRepository.searchPublicGroups(debouncedSearch.trim(), 10, nextCursor);
      setResults(prev => [...prev, ...groups]);
      setNextCursor(newCursor);
    } catch (err) {
      console.error("Failed to load more", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    setJoiningId(groupId);
    try {
      await groupRepository.joinPublicGroup(groupId, user.uid);
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("Failed to join group", err);
      alert("Failed to join group");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Explore Public Groups</Title>
        <Button variant="subtle" onClick={() => router.push('/groups')}>Back to My Groups</Button>
      </Group>

      <Card withBorder shadow="sm" radius="md" padding="md" mb="xl">
        <TextInput
          placeholder="Search public groups by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          style={{ flex: 1 }}
          rightSection={searching ? <Loader size="xs" color="digital-atlas-cyan" /> : <span style={{ fontSize: '1.2rem' }}>🔍</span>}
        />
      </Card>

      <Stack gap="md">
        {results.length === 0 && !searching ? (
          <Text c="dimmed" ta="center">
            {debouncedSearch.trim() ? `No public groups found matching "${debouncedSearch}"` : 'No public groups available right now.'}
          </Text>
        ) : (
          results.map((g) => (
            <Card key={g.id} withBorder shadow="sm" radius="md" padding="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text fw={600} size="lg">{g.name}</Text>
                  {g.description && <Text size="sm" c="dimmed">{g.description}</Text>}
                  <Text size="xs" mt="sm">{g.memberCount} Members • {g.visibility === 'public' ? <><GlobeIcon /> Public</> : <><LockIcon /> Private</>}</Text>
                </Stack>
                {myGroupIds.has(g.id) ? (
                  <Button
                    variant="light"
                    color="gray"
                    onClick={() => router.push(`/groups/${g.id}`)}
                  >
                    View Group
                  </Button>
                ) : (
                  <Button 
                    color="digital-atlas-cyan" 
                    onClick={() => g.id && handleJoin(g.id)}
                    loading={joiningId === g.id}
                    variant="light"
                  >
                    Join
                  </Button>
                )}
              </Group>
            </Card>
          ))
        )}
        
        {nextCursor && (
          <Center mt="lg">
            <Button variant="light" color="digital-atlas-cyan" onClick={handleLoadMore} loading={loadingMore}>
              Load More
            </Button>
          </Center>
        )}
      </Stack>
    </Container>
  );
}
