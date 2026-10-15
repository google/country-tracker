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
import useSWR from 'swr';
import { fetchSecureLeaderboard, fetchGroupLeaderboard } from '@/app/actions/leaderboard';
import Leaderboard from './Leaderboard';
import { Loader, Center, Stack, Title } from '@mantine/core';
import { useAuth } from '@/lib/AuthContext';

interface LeaderboardContainerProps {
  groupId?: string;
}

/** JSDoc
 * This container component strictly coordinates data-fetching and loading states
 * for the leaderboard implementation using SWR and Next.js Server Actions.
 * Depending on whether a groupId is passed, it intelligently negotiates
 * calling either the global secure leaderboard, or an isolated, context-aware group leaderboard.
 */
const LeaderboardContainer: React.FC<LeaderboardContainerProps> = ({ groupId }) => {
  const { user } = useAuth();
  
  const { data: entries, isLoading } = useSWR(
    user ? (groupId ? `group-leaderboard-${groupId}-${user.uid}` : 'global-leaderboard') : null,
    async () => {
      if (!user) return [];
      if (groupId) {
        return await fetchGroupLeaderboard(user.uid, groupId);
      }
      return await fetchSecureLeaderboard(user.uid);
    }
  );

  if (isLoading && !entries) {
    return (
      <Center py="xl">
        <Loader size="xl" data-testid="leaderboard-loader" />
      </Center>
    );
  }

  return (
    <Stack gap="md" py="xs">
      <Leaderboard entries={entries || []} currentUserId={user?.uid} />
    </Stack>
  );
};

export default LeaderboardContainer;
