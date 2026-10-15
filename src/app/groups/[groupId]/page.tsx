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

import React, { useState, use } from 'react';
import useSWR from 'swr';
import { Title, Container, Card, Stack, Text, Loader, Center, Button, Group, Modal, MultiSelect, Menu, Select, Table, Avatar, ActionIcon, Anchor, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ServiceRegistry } from '@/lib/services/registry';

const groupRepository = ServiceRegistry.getGroupRepository();
const friendsRepository = ServiceRegistry.getFriendsRepository();
import { fetchGroupLeaderboard } from '@/app/actions/leaderboard';

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>
);

const TrophyIcon = () => (
  <svg style={{ verticalAlign: 'middle', marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1 -10 0v-8"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>
);

/** JSDoc
 * Provides the interactive primary layout bound to a specific Group document instance.
 * Executes three mandatory cascading hooks mapping overall config, isolated member context,
 * and the explicitly resolved leaderboard data in order.
 */
export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const { user } = useAuth();
  const router = useRouter();

  // 1. Fetch Group Details natively. Serves as the origin layer.
  const { data: group, isLoading: isLoadingGroup, mutate: mutateGroup } = useSWR(
    user && groupId ? `group-${groupId}` : null,
    () => groupRepository.getGroupById(groupId)
  );

  // 2. Fetch specific Member Details cross-referencing auth-uid against the junction table. Determines roles.
  const { data: memberDetails, mutate: mutateMember } = useSWR(
    user && group ? `group-member-${groupId}-${user.uid}` : null,
    () => groupRepository.getGroupMemberDetails(groupId, user!.uid)
  );

  // 3. Extrapolate active leaderboard configurations bypassing baseline lists, factoring in privacy flags natively contextually.
  const { data: entries = [], isLoading: isLoadingEntries, mutate: mutateEntries } = useSWR(
    user && group && memberDetails ? `group-leaderboard-${groupId}-${user.uid}` : null,
    () => fetchGroupLeaderboard(user!.uid, groupId)
  );

  // 4. Resolve the active subset of system peers for invite operations
  const { data: friendsList = [] } = useSWR(
    user ? `friends-${user.uid}` : null,
    () => friendsRepository.getFriends(user!.uid)
  );

  // Add Member Modal State
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Transfer Ownership State
  const [transferOpened, { open: openTransfer, close: closeTransfer }] = useDisclosure(false);
  const [newOwnerId, setNewOwnerId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Edit Group State
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updatingGroup, setUpdatingGroup] = useState(false);

  const handleOpenEdit = () => {
    if (group) {
        setEditName(group.name);
        setEditDesc(group.description || '');
        openEdit();
    }
  };

  // Settings Modal State
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) return;
    setSaving(true);
    try {
      await groupRepository.addMembersToGroup(groupId, selectedFriends);
      close();
      setSelectedFriends([]);
      mutateGroup(); // Revalidate group data
    } catch (err) {
      console.error("Failed to add members", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    const myRole = memberDetails?.role;
    if (myRole === 'owner') {
      alert("You are the owner. You must transfer ownership to someone else before leaving.");
      return;
    }
    if (!confirm("Are you sure you want to leave this group?")) return;
    
    try {
      await groupRepository.removeUserFromGroup(groupId, user.uid);
      router.push('/groups');
    } catch (err) {
      console.error("Failed to leave group", err);
    }
  };

  const handleRemoveMember = async (targetUid: string, name: string) => {
    if (!isAdmin || !user || targetUid === user.uid) return;
    if (!confirm(`Are you sure you want to remove ${name} from the group?`)) return;
    
    try {
      await groupRepository.removeUserFromGroup(groupId, targetUid);
      mutateGroup();
      mutateEntries();
    } catch (err) {
      console.error("Failed to remove member", err);
      alert("Failed to remove member.");
    }
  };

  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const handlePrivacyChange = async (val: string | null) => {
    if (!user || !val) return;
    setSavingPrivacy(true);
    try {
      await groupRepository.updateGroupLeaderboardPrivacy(groupId, user.uid, val as 'public' | 'anonymous' | 'inherit');
      await mutateMember();
    } catch (err) {
      console.error("Failed to update privacy:", err);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!user || !newOwnerId) return;
    setTransferring(true);
    try {
      await groupRepository.transferGroupOwnership(groupId, user.uid, newOwnerId);
      closeTransfer();
      setNewOwnerId(null);
      mutateGroup(); // Revalidate group data to fetch new memberDetails roles implicitly through focus, or page refresh
      window.location.reload(); // Hard reload to easily sync all new permission lists
    } catch (err) {
      console.error("Failed to transfer ownership", err);
      alert("Failed to transfer ownership.");
    } finally {
      setTransferring(false);
    }
  };

  const handleUpdateGroupDetails = async () => {
    if (!user || !editName.trim()) return;
    setUpdatingGroup(true);
    try {
      await groupRepository.updateGroupDetails(groupId, editName.trim(), editDesc.trim());
      closeEdit();
      mutateGroup();
    } catch (err) {
      console.error("Failed to update group:", err);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const loading = isLoadingGroup;

  if (loading) {
    return <Center py="xl"><Loader size="xl" /></Center>;
  }

  if (!group) {
    return (
      <Container size="sm" py="xl">
        <Title order={2} ta="center" c="red">Group Not Found</Title>
        <Center mt="md">
          <Button onClick={() => router.push('/groups')}>Back to Groups</Button>
        </Center>
      </Container>
    );
  }

  const knownMemberUids = entries.map(e => e.uid).filter(Boolean) as string[];
  const friends = friendsList.filter(friend => !knownMemberUids.includes(friend.uid));
  const friendOptions = friends.map(f => ({
    value: f.uid || '',
    label: f.displayName || f.email || 'Unknown User'
  })).filter(f => f.value !== '');

  const transferOptions = entries
    .filter(e => e.uid && e.uid !== user?.uid)
    .map(e => ({
      value: e.uid as string,
      label: e.displayName || 'Anonymous Explorer'
    }));

  const myRole = memberDetails?.role || 'member';
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const canAddMembers = group.visibility === 'public' || isAdmin;

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="lg" align="flex-start">
        <div>
          <Group gap="xs">
            <Title order={2}>{group.name}</Title>
            {isAdmin && (
              <ActionIcon variant="subtle" color="gray" onClick={handleOpenEdit}title="Edit Group">
                <PencilIcon />
              </ActionIcon>
            )}
          </Group>
          {group.description && <Text c="dimmed" mt={4}>{group.description}</Text>}
        </div>
        <Group>
          {canAddMembers && <Button variant="light" onClick={open}>Add Members</Button>}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" color="gray">Manage</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={openSettings}>
                Group Settings
              </Menu.Item>
              {myRole === 'owner' && (
                <Menu.Item onClick={openTransfer}>
                  Transfer Ownership
                </Menu.Item>
              )}
              <Menu.Item color="red" onClick={handleLeaveGroup}>
                Leave Group
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button variant="subtle" onClick={() => router.push('/groups')}>Back</Button>
        </Group>
      </Group>

      <Stack gap="md" mt="xl">
        <Group justify="space-between" align="flex-end">
            <Text fw={600} size="lg">Members Roster</Text>
            <Anchor component={Link} href="/leaderboard" size="sm" c="digital-atlas-cyan">
               <TrophyIcon /> View Rankings
            </Anchor>
        </Group>
        
        <Card shadow="sm" radius="md" withBorder>
          {isLoadingEntries && entries.length === 0 ? (
            <Center py="sm"><Loader size="md" /></Center>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {entries.map((entry, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Group justify="space-between" wrap="nowrap" w="100%">
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1, overflow: 'hidden' }}>
                          <Avatar src={entry.photoURL || undefined} radius="xl" size="sm" color="blue">
                             {entry.displayName ? entry.displayName.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Text fw={500} truncate="end" style={{ flex: 1 }}>
                            {entry.displayName || 'Anonymous User'} 
                            {entry.uid === user?.uid && <Text span c="dimmed" ml={4}>(You)</Text>}
                          </Text>
                        </Group>
                        {isAdmin && entry.uid && entry.uid !== user?.uid && entry.uid !== group.ownerId && (
                          <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveMember(entry.uid!, entry.displayName)}>
                            <TrashIcon />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Stack>

      <Modal opened={opened} onClose={close} title="Add Friends to Group" centered>
        <Stack gap="md">
          {friendOptions.length === 0 ? (
            <Text c="dimmed">All your travel mates are already in this group, or you have no friends to add.</Text>
          ) : (
            <>
              <MultiSelect
                label="Invite Friends"
                placeholder="Select friends to add"
                data={friendOptions}
                value={selectedFriends}
                onChange={setSelectedFriends}
                searchable
                clearable
              />
              <Button 
                mt="md" 
                loading={saving} 
                onClick={handleAddMembers} 
                disabled={selectedFriends.length === 0}
                color="digital-atlas-cyan"
              >
                Add to Group
              </Button>
            </>
          )}
        </Stack>
      </Modal>

      <Modal opened={transferOpened} onClose={closeTransfer} title="Transfer Ownership" centered>
        <Stack gap="md">
          {transferOptions.length === 0 ? (
            <Text c="dimmed">There are no other standard members to transfer ownership to.</Text>
          ) : (
            <>
              <Text size="sm">Select a member to inherit absolute ownership of this group. You will be demoted to an admin.</Text>
              <Select
                label="Select New Owner"
                placeholder="Pick a member"
                data={transferOptions}
                value={newOwnerId}
                onChange={setNewOwnerId}
                searchable
              />
              <Button 
                mt="md" 
                loading={transferring} 
                onClick={handleTransferOwnership} 
                disabled={!newOwnerId}
                color="red"
              >
                Transfer & Demote Me
              </Button>
            </>
          )}
        </Stack>
      </Modal>

      <Modal opened={settingsOpened} onClose={closeSettings} title="Group Settings" centered>
        <Stack gap="md">
          <Select
            label="My Group Privacy"
            description="Override your global privacy setting for this specific group."
            disabled={savingPrivacy}
            data={[
              { value: 'inherit', label: 'Global Setting' },
              { value: 'public', label: 'Public' },
              { value: 'anonymous', label: 'Anonymous' }
            ]}
            value={memberDetails?.leaderboardVisibility || 'inherit'}
            onChange={handlePrivacyChange}
          />
        </Stack>
      </Modal>
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Group Details" centered>
        <Stack gap="md">
          <TextInput 
            label="Group Name" 
            placeholder="e.g. Euro Trip 2026" 
            required 
            value={editName} 
            onChange={(e) => setEditName(e.currentTarget.value)} 
          />
          <TextInput 
            label="Description (Optional)" 
            placeholder="What is this group for?" 
            value={editDesc} 
            onChange={(e) => setEditDesc(e.currentTarget.value)} 
          />
          <Button 
            mt="md" 
            loading={updatingGroup} 
            onClick={handleUpdateGroupDetails} 
            disabled={!editName.trim()}
            color="digital-atlas-cyan"
          >
            Save Changes
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
