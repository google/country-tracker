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
import { Title, Container, Card, Select, Button, Group, Stack, Text, Loader, Center, Alert, TextInput, Box } from '@mantine/core';
import { useAuth } from '@/lib/AuthContext';
import { ServiceRegistry } from '@/lib/services/registry';
import { PrivacySettings } from '@/lib/services/interfaces';
import useSWR from 'swr';

const userRepository = ServiceRegistry.getUserRepository();
import Link from 'next/link';

/** JSDoc
 * The primary account configuration view for manipulating User-scoped metadata globally.
 * Controls display names, profile visibility toggles, and ranking board anonymization.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    globalLeaderboard: 'public'
  });

  const { data: profile, isLoading, mutate } = useSWR(
    user ? `user-profile-${user.uid}` : null,
    () => userRepository.getProfile(user!.uid)
  );

  useEffect(() => {
    if (profile) {
      if (profile.privacy) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrivacy(profile.privacy);
      }
      if (profile.displayName) {
        setDisplayName(profile.displayName);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const nameToSave = displayName.trim() || user.displayName || 'Anonymous';
      
      // Await parallel mutation operations mapping both privacy sub-objects and root-level display constraints
      await userRepository.updatePrivacySettings(user.uid, privacy);
      await userRepository.updateUserDisplayName(user.uid, nameToSave);
      
      // Forcibly inject updated settings directly over the local active cache to prevent UX stalling and reloading
      mutate({ ...profile, privacy, displayName: nameToSave }, false); // Optimistic update
      setMessage({ type: 'success', text: 'Privacy & Profile settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <Center py="xl">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Settings & Privacy</Title>
        {user && (
          <Button component={Link} href={`/profile/${user.uid}`} variant="light" color="digital-atlas-cyan">
            View My Public Profile
          </Button>
        )}
      </Group>

      {message && (
        <Alert color={message.type === 'success' ? 'green' : 'red'} mb="md" variant="light">
          {message.text}
        </Alert>
      )}

      <Card withBorder shadow="sm" radius="md" padding="xl">
        <Stack gap="lg">
          <Box>
            <Text fw={600} size="lg" mb="sm">Display Name</Text>
            <Text size="sm" c="dimmed" mb="md">
              How your name will appear across Travel Groups and Leaderboards (unless set to Anonymous).
            </Text>
            <TextInput
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
              size="md"
            />
          </Box>

          <Box>
            <Text fw={600} size="lg" mb="sm">Profile Visibility</Text>
            <Text size="sm" c="dimmed" mb="md">
              Control who can visit your personal passport page and view your detailed Travel Map and flags.
            </Text>
            <Select
              data={[
                { value: 'public', label: 'Public (Anyone can view)' },
                { value: 'friends', label: 'Friends Only (Only Travel Mates)' },
                { value: 'private', label: 'Private (Completely hidden)' }
              ]}
              value={privacy.profileVisibility}
              onChange={(value) => setPrivacy(p => ({ ...p, profileVisibility: (value as any) || 'public' }))}
              allowDeselect={false}
              size="md"
            />
          </Box>

          <Box>
            <Text fw={600} size="lg" mb="sm">Global Leaderboard Status</Text>
            <Text size="sm" c="dimmed" mb="md">
              Should your full name and photo appear on the global ranking board? Your country count will still be ranked globally, but your identity will be mathematically masked to other users if set to Anonymous.
            </Text>
            <Select
              data={[
                { value: 'public', label: 'Public (Full Name & Photo)' },
                { value: 'friends', label: 'Friends Only (Only Travel Mates)' },
                { value: 'anonymous', label: 'Anonymous (Masked identity)' }
              ]}
              value={privacy.globalLeaderboard}
              onChange={(value) => setPrivacy(p => ({ ...p, globalLeaderboard: (value as any) || 'public' }))}
              allowDeselect={false}
              size="md"
            />
          </Box>

          <Group justify="flex-end" mt="md">
            <Button 
              color="digital-atlas-cyan" 
              onClick={handleSave} 
              loading={saving}
            >
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
