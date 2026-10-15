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
import { Title, Container, Card, Tabs, Button, Group, Stack, Text, Loader, Center, TextInput, Avatar, Alert, ActionIcon, Box, Anchor } from '@mantine/core';
import { useAuth } from '@/lib/AuthContext';
import { ServiceRegistry } from '@/lib/services/registry';
import Link from 'next/link';

const friendsRepository = ServiceRegistry.getFriendsRepository();
import useSWR from 'swr';

/** JSDoc
 * Central hub for resolving bidirectional social relationships (Travel Mates).
 * Implements a 3-tier tabbed architecture separating active friends, pending inbound requests,
 * and outbound global user searches. Manages optimistic cache invalidations automatically upon mutations.
 */
export default function FriendsPage() {
  const { user } = useAuth();
  
  const { data: friends = [], isLoading: isLoadingFriends, mutate: mutateFriends } = useSWR(
    user ? `friends-${user.uid}` : null,
    () => friendsRepository.getFriends(user!.uid)
  );

  const { data: requests = [], isLoading: isLoadingRequests, mutate: mutateRequests } = useSWR(
    user ? `pending-requests-${user.uid}` : null,
    () => friendsRepository.getPendingRequests(user!.uid)
  );
  
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  /** JSDoc
   * Executes a strict exact-match server lookup bypassing partial text search 
   * to guarantee privacy compliance preventing brute-force directory scraping.
   */
  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearchError('');
    setSearchResult(null);
    setRequestStatus('');
    try {
       const foundUser = await friendsRepository.searchUserByEmail(searchEmail.trim());
      if (foundUser) {
        if (foundUser.uid === user?.uid) {
          setSearchError("You cannot add yourself.");
        } else {
          setSearchResult(foundUser);
        }
      } else {
        setSearchError("No traveler found with that email address.");
      }
    } catch (error) {
      setSearchError("Error searching for user.");
    }
  };

  const handleSendRequest = async () => {
    if (!user || !searchResult) return;
    setSendingRequest(true);
    try {
      await friendsRepository.sendFriendRequest(user.uid, searchResult.uid);
      setRequestStatus(`Friend request successfully sent to ${searchResult.displayName || searchResult.email}!`);
      setSearchResult(null);
      setSearchEmail('');
    } catch (error: any) {
      setRequestStatus(error.message || "Failed to send request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await friendsRepository.acceptFriendRequest(requestId);
      mutateRequests();
      mutateFriends();
    } catch (err) {
      console.error("Failed to accept:", err);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await friendsRepository.declineFriendRequest(requestId);
      mutateRequests();
    } catch (err) {
      console.error("Failed to decline:", err);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await friendsRepository.removeFriend(friendshipId);
      mutateFriends();
    } catch (err) {
      console.error("Failed to remove friend", err);
    }
  };

  const loading = (isLoadingFriends && friends.length === 0) || (isLoadingRequests && requests.length === 0);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">Travel Mates</Title>

      <Card withBorder shadow="sm" radius="md" padding="xl">
        <Tabs defaultValue="friends" variant="pills" radius="md">
          <Tabs.List grow mb="xl">
            <Tabs.Tab value="friends" fw={600}>My Friends ({friends.length})</Tabs.Tab>
            <Tabs.Tab value="requests" fw={600}>Requests ({requests.length})</Tabs.Tab>
            <Tabs.Tab value="add" fw={600}>Add a Friend</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="friends">
            <Stack gap="md">
              {friends.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">You have not added any travel mates yet!</Text>
              ) : (
                friends.map((f, i) => (
                  <Card key={i} withBorder padding="sm" radius="md">
                    <Group justify="space-between">
                      <Anchor component={Link} href={`/profile/${f.uid}`} underline="never" c="inherit">
                        <Group>
                          <Avatar src={f.photoURL} radius="xl" name={f.displayName} />
                          <Box style={{ flexGrow: 1 }}>
                            <Text fw={600}>{f.displayName || f.email}</Text>
                            <Text size="sm" c="dimmed">{f.visitedCountries?.length || 0} Countries Visited</Text>
                          </Box>
                        </Group>
                      </Anchor>
                      <Button variant="subtle" color="red" size="sm" onClick={() => handleRemoveFriend(f.friendshipId)}>
                        Remove
                      </Button>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="requests">
            <Stack gap="md">
              {requests.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">No pending requests right now.</Text>
              ) : (
                requests.map((r, i) => (
                  <Card key={i} withBorder padding="sm" radius="md">
                    <Group>
                      <Avatar src={r.requester?.photoURL} radius="xl" name={r.requester?.displayName} />
                      <Box style={{ flexGrow: 1 }}>
                        <Text fw={600}>{r.requester?.displayName || r.requester?.email}</Text>
                        <Text size="sm" c="dimmed">wants to share their travel stats with you.</Text>
                      </Box>
                      <Group gap="xs">
                        <Button variant="light" color="digital-atlas-cyan" onClick={() => handleAccept(r.id)}>Accept</Button>
                        <Button variant="subtle" color="red" onClick={() => handleDecline(r.id)}>Decline</Button>
                      </Group>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="add">
            <Stack gap="md">
              <Text fw={500}>Find your friends by exact email address:</Text>
              <Group>
                <TextInput 
                  placeholder="traveler@example.com" 
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.currentTarget.value)}
                  style={{ flexGrow: 1 }}
                />
                <Button color="digital-atlas-cyan" onClick={handleSearch}>Search</Button>
              </Group>

              {searchError && <Text c="red" size="sm">{searchError}</Text>}
              
              {searchResult && (
                 <Card withBorder padding="md" radius="md" mt="md">
                 <Group>
                   <Avatar src={searchResult.photoURL} radius="xl" name={searchResult.displayName} />
                   <Box style={{ flexGrow: 1 }}>
                     <Text fw={600}>{searchResult.displayName}</Text>
                   </Box>
                   <Button loading={sendingRequest} variant="light" color="digital-atlas-cyan" onClick={handleSendRequest}>
                     Send Request
                   </Button>
                 </Group>
               </Card>
              )}

              {requestStatus && <Alert variant="light" color={requestStatus.includes('successfully') ? 'green' : 'red'}>{requestStatus}</Alert>}
            </Stack>
          </Tabs.Panel>

        </Tabs>
      </Card>
    </Container>
  );
}
