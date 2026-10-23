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
 * Leaderboard — Traveler Standings & Podium Badges
 *
 * Architectural Rationale:
 * Enhances top-3 podium standings (#1 Gold, #2 Silver, #3 Bronze) using inline
 * 24x24 strokeWidth=2 Tabler SVG trophy/medal icons aligned with the icon system
 * in `AppShellLayout.tsx` and `src/app/groups/[groupId]/page.tsx`.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, Avatar, Group, Text, Badge, Paper, Anchor, Pagination, Stack, Center } from '@mantine/core';

/**
 * Inline 24x24 strokeWidth=2 Tabler trophy/medal icon matching AppShellLayout's SVG convention.
 */
const PodiumTrophyIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10" />
    <path d="M17 4v8a5 5 0 0 1 -10 0v-8" />
    <circle cx="5" cy="9" r="2" />
    <circle cx="19" cy="9" r="2" />
  </svg>
);

const PODIUM_ACCENTS: Record<number, { color: string; bg: string; label: string }> = {
  1: {
    color: '#D97706',
    bg: 'light-dark(rgba(244, 162, 97, 0.16), rgba(217, 119, 6, 0.15))',
    label: 'Gold Explorer',
  },
  2: {
    color: '#64748B',
    bg: 'light-dark(rgba(148, 163, 184, 0.14), rgba(100, 116, 139, 0.14))',
    label: 'Silver Explorer',
  },
  3: {
    color: '#B45309',
    bg: 'light-dark(rgba(217, 119, 6, 0.10), rgba(180, 83, 9, 0.12))',
    label: 'Bronze Explorer',
  },
};

const getPodiumAccent = (rank: number) => PODIUM_ACCENTS[rank] || null;

/** JSDoc
 * Defines the structured payload expected for a single row in the leaderboard.
 * Fields like 'uid' and 'photoURL' may be intentionally nullified by the backend
 * to preserve anonymous privacy modes.
 */
interface LeaderboardEntry {
  uid: string | null;
  idKey: string;
  displayName: string;
  photoURL: string | null;
  count: number;
  isPrivateMode?: boolean;
}

/** JSDoc
 * Props expected by the main Leaderboard array renderer.
 */
interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

/** JSDoc
 * Generates the paginated table view of global or group leaderboard entries.
 * Manages local pagination state independently of the backend fetch to rapidly slice the array.
 * Includes dynamic row shading when the authenticated user locates their own rank.
 */
const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserId }) => {
  const PAGE_SIZE = 50;
  const [activePage, setPage] = useState(1);

  // If the underlying data array shrinks dynamically (e.g. switching between groups)
  // Ensure the user is not marooned on an empty, out-of-bounds page.
  useEffect(() => {
    if (entries.length > 0 && Math.ceil(entries.length / PAGE_SIZE) < activePage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(1);
    }
  }, [entries.length, activePage]);

  // Handle empty state gracefully
  if (entries.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Text c="dimmed" ta="center">No users found</Text>
      </Paper>
    );
  }

  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  // Isolate the specific subset of memory-cached arrays needed for the current table page
  const paginatedEntries = entries.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  // Map the subset into distinct UI rows
  const rows = paginatedEntries.map((entry, index) => {
    const isCurrentUser = entry.uid === currentUserId;
    // Calculate the absolute global rank based on the page offset rather than relative row number
    const globalRank = (activePage - 1) * PAGE_SIZE + index + 1;
    const podium = getPodiumAccent(globalRank);
    
    return (
      <Table.Tr 
        key={entry.idKey} 
        style={
          isCurrentUser
            ? { backgroundColor: 'var(--mantine-color-digital-atlas-cyan-light)', fontWeight: 600 }
            : podium
              ? { backgroundColor: podium.bg }
              : undefined
        }
      >
        <Table.Td>
          <Group gap={6} wrap="nowrap">
            {podium && <PodiumTrophyIcon color={podium.color} />}
            <Text
              fw={isCurrentUser || podium ? 800 : 700}
              size="lg"
              c={isCurrentUser ? 'digital-atlas-cyan.6' : undefined}
              style={{
                color: !isCurrentUser && podium ? podium.color : undefined,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              #{globalRank}
            </Text>
          </Group>
        </Table.Td>
        <Table.Td>
          {/* Branch based on privacy limits. If a UID was exposed, allow hyperlinking to their full profile */}
          {entry.uid ? (
            <Anchor component={Link} href={`/profile/${entry.uid}`} underline="never" c="inherit" style={{ display: 'block' }}>
              <Group gap="sm">
                <Avatar src={entry.photoURL || undefined} radius="xl" name={entry.displayName} />
                <div>
                  <Text size="sm" fw={isCurrentUser ? 700 : 600} c={isCurrentUser ? 'digital-atlas-cyan.6' : undefined}>
                    {entry.displayName} {isCurrentUser && "(You)"}
                  </Text>
                  {entry.isPrivateMode && (
                    <Text size="xs" c="dimmed" fs="italic">👻 Invisible to others</Text>
                  )}
                </div>
              </Group>
            </Anchor>
          ) : (
            <div style={{ display: 'block', color: 'inherit' }}>
              <Group gap="sm">
                <Avatar src={entry.photoURL || undefined} radius="xl" name={entry.displayName} />
                <div>
                  <Text size="sm" fw={500}>
                    {entry.displayName}
                  </Text>
                </div>
              </Group>
            </div>
          )}
        </Table.Td>
        <Table.Td>
          <Badge
            variant={isCurrentUser ? "filled" : "light"}
            color={globalRank === 1 && !isCurrentUser ? "sunlit-marigold" : "digital-atlas-cyan"}
            size="lg"
            radius="sm"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          >
            {entry.count} Countries
          </Badge>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="md">
      <Paper withBorder shadow="sm" radius="lg" p={0} style={{ overflow: 'hidden' }}>
        <div className="airmail-border" />
        <div style={{ padding: '1rem' }}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={100}>Rank</Table.Th>
                <Table.Th>Explorer</Table.Th>
                <Table.Th w={170}>Countries Visited</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>
      </Paper>
      
      {totalPages > 1 && (
        <Center>
          <Pagination 
            total={totalPages} 
            value={activePage} 
            onChange={setPage} 
            color="digital-atlas-cyan" 
            radius="md" 
          />
        </Center>
      )}
    </Stack>
  );
};

export default Leaderboard;
