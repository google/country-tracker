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
import useSWR from 'swr';
import { useAuth } from '@/lib/AuthContext';
import LeaderboardContainer from '@/components/LeaderboardContainer';
import { Title, Container, Tabs, Select, Stack, Center, Text, Anchor, Group } from '@mantine/core';
import { ServiceRegistry } from '@/lib/services/registry';
import Link from 'next/link';

const groupRepository = ServiceRegistry.getGroupRepository();

const WorldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" /></svg>
);

const GroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1"/><path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M17 10h2a2 2 0 0 1 2 2v1"/><path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M3 13v-1a2 2 0 0 1 2 -2h2"/></svg>
);

/** JSDoc
 * Renders the `/leaderboard` route serving as a central dashboard for tracking user ranks.
 * Operates a tabbed architecture to split concerns between the Global unrestricted leaderboard
 * and specific, isolated Group leaderboards dynamically hydrated from the user's active memberships.
 */
export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('global');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Poll the database to generate a dropdown specifically for the 'My Groups' tab.
  const { data: groups = [] } = useSWR(
    user ? `groups-${user.uid}` : null,
    () => groupRepository.getUserGroups(user!.uid)
  );

  const groupOptions = groups.map(g => ({
    value: g.id || '',
    label: g.name
  }));

  useEffect(() => {
    if (activeTab === 'groups' && !selectedGroupId && groupOptions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedGroupId(groupOptions[0].value);
    }
  }, [activeTab, selectedGroupId, groupOptions]);

  if (!user) return null;

  return (
    <Container size="xl" py="md">
      <Title order={1} mb="xl">Community Leaderboards</Title>
      
      <Tabs value={activeTab} onChange={setActiveTab} color="digital-atlas-cyan" variant="pills" radius="md" mb="xl">
        <Group justify="space-between" align="center" mb="md" wrap="wrap">
          <Tabs.List>
            <Tabs.Tab value="global" leftSection={<WorldIcon />}>Global Leaderboard</Tabs.Tab>
            <Tabs.Tab value="groups" leftSection={<GroupIcon />}>My Groups</Tabs.Tab>
          </Tabs.List>
          
          {activeTab === 'groups' && groups.length > 0 && (
            <Select
              placeholder="Select expanding group..."
              data={groupOptions}
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              searchable
              clearable={false}
              size="sm"
              radius="md"
              leftSection={<GroupIcon />}
              maw={300}
              style={{ flexGrow: 1 }}
            />
          )}
        </Group>

        <Tabs.Panel value="global" pt="sm">
          <LeaderboardContainer />
        </Tabs.Panel>

        <Tabs.Panel value="groups" pt="sm">
           <Stack gap="md">
             {groups.length === 0 ? (
               <Center py="xl">
                 <Text c="dimmed">You are not part of any groups yet. <Anchor component={Link} href="/groups">Find or create one!</Anchor></Text>
               </Center>
             ) : (
               <>
                 {selectedGroupId && (() => {
                   const g = groups.find(x => x.id === selectedGroupId);
                   return g?.description ? (
                     <Text c="dimmed" size="sm" fs="italic">
                       {g.description}
                     </Text>
                   ) : null;
                 })()}
                 {selectedGroupId && <LeaderboardContainer groupId={selectedGroupId} />}
               </>
             )}
           </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
