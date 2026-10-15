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
import { Title, Container, Card, Button, Group, Stack, Text, Loader, Center, TextInput, Modal, MultiSelect, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ServiceRegistry } from '@/lib/services/registry';

const groupRepository = ServiceRegistry.getGroupRepository();
const friendsRepository = ServiceRegistry.getFriendsRepository();

const GlobeIcon = () => (
  <svg style={{ verticalAlign: 'middle', marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1 -4 10 15.3 15.3 0 0 1 -4 -10 15.3 15.3 0 0 1 4 -10z"/><path d="M2 12h20"/></svg>
);

const LockIcon = () => (
  <svg style={{ verticalAlign: 'middle', marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M12 16v1"/><path d="M8 11v-4a4 4 0 0 1 8 0v4"/></svg>
);

/** JSDoc
 * Renders the primary `My Groups` dashboard natively filtering for authenticated memberships.
 * Orchestrates local modals mimicking a multi-route onboarding flow via React toggles
 * allowing creation of both public searchable and private ad-hoc groupings.
 */
export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const { data: groups = [], isLoading: isLoadingGroups } = useSWR(
    user ? `groups-${user.uid}` : null,
    () => groupRepository.getUserGroups(user!.uid)
  );

  const { data: friends = [] } = useSWR(
    user ? `friends-${user.uid}` : null,
    () => friendsRepository.getFriends(user!.uid)
  );
  
  // Modal State
  const [opened, { open, close }] = useDisclosure(false);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    setCreating(true);
    try {
      const groupId = await groupRepository.createGroup(newGroupName.trim(), newGroupDesc.trim(), user.uid, selectedFriends, visibility);
      close();
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("Failed to create group", err);
      setCreating(false);
    }
  };

  const friendOptions = friends.map(f => ({
    value: f.uid || '',
    label: f.displayName || f.email || 'Unknown User'
  })).filter(f => f.value !== '');

  const loading = isLoadingGroups && groups.length === 0;

  if (loading) {
    return <Center py="xl"><Loader size="xl" /></Center>;
  }

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Travel Groups</Title>
        <Group>
          <Button variant="light" color="digital-atlas-cyan" onClick={() => router.push('/groups/explore')}>Explore Public Groups</Button>
          <Button onClick={open} color="digital-atlas-cyan">Create Group</Button>
        </Group>
      </Group>

      <Stack gap="md">
        {groups.length === 0 ? (
          <Card withBorder padding="xl" ta="center">
            <Text c="dimmed">You are not part of any travel groups yet.</Text>
            <Button mt="md" variant="light" onClick={open}>Create your first group</Button>
          </Card>
        ) : (
          groups.map((g) => (
            <Card key={g.id} withBorder shadow="sm" radius="md" padding="md" style={{ cursor: 'pointer' }} onClick={() => router.push(`/groups/${g.id}`)}>
              <Text fw={600} size="lg">{g.name}</Text>
              {g.description && <Text size="sm" c="dimmed">{g.description}</Text>}
              <Text size="xs" mt="sm">{g.memberCount} Members • {g.visibility === 'public' ? <><GlobeIcon /> Public</> : <><LockIcon /> Private</>}</Text>
            </Card>
          ))
        )}
      </Stack>

      <Modal opened={opened} onClose={close} title="Create a New Group" centered>
        <Stack gap="md">
          <TextInput 
            label="Group Name" 
            placeholder="e.g. Euro Trip 2026" 
            required 
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.currentTarget.value)} 
          />
          <TextInput 
            label="Description (Optional)" 
            placeholder="What is this group for?" 
            value={newGroupDesc} 
            onChange={(e) => setNewGroupDesc(e.currentTarget.value)} 
          />
          <MultiSelect
            label="Invite Friends"
            placeholder="Select friends to add"
            data={friendOptions}
            value={selectedFriends}
            onChange={setSelectedFriends}
            searchable
            clearable
          />
          <Select
            label="Group Visibility"
            data={[
              { value: 'private', label: 'Private (Invite Only)' },
              { value: 'public', label: 'Public (Searchable & Open to All)' }
            ]}
            value={visibility}
            onChange={(v) => setVisibility(v as 'public' | 'private')}
          />
          <Button 
            mt="md" 
            loading={creating} 
            onClick={handleCreateGroup} 
            disabled={!newGroupName.trim()}
            color="digital-atlas-cyan"
          >
            Create Group
          </Button>
        </Stack>
      </Modal>

    </Container>
  );
}
