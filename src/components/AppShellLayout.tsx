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
import { AppShell, Burger, Group, NavLink, Title, ActionIcon, useMantineColorScheme, Text, Button, Badge, Anchor } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ServiceRegistry } from '@/lib/services/registry';

const friendsRepository = ServiceRegistry.getFriendsRepository();

// Standardize simple inline SVG icons to reduce heavy library dependencies directly inside the primary chunk
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l-2 2l9 -9l9 9l-2 -2"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/></svg>
);

const LeaderboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21v-12"/><path d="M12 21v-18"/><path d="M16 21v-6"/><path d="M4 21h16"/></svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/></svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"/><path d="M9 4v13"/><path d="M15 7v13"/></svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"/><circle cx="12" cy="12" r="3"/></svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>
);

const GroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1"/><path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M17 10h2a2 2 0 0 1 2 2v1"/><path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M3 13v-1a2 2 0 0 1 2 -2h2"/></svg>
);

interface AppShellLayoutProps {
  children: React.ReactNode;
}

/** JSDoc
 * The core structural boundary wrapping all authenticated application routes natively.
 * Enforces Mantine's AppShell standard including the responsive sidebar and top navigational header.
 * Conditionally suspends the sidebar routing logic if evaluating on an uncontrolled public route like /login.
 */
export default function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, logOut } = useAuth();
  
  // Actively poll the server via SWR for inbound friendship connections
  const { data: pendingRequests } = useSWR(
    user ? `pending-requests-${user.uid}` : null,
    () => friendsRepository.getPendingRequests(user!.uid)
  );

  // Compute unread interaction badges for the sidebar link
  const pendingCount = pendingRequests?.length || 0;

  // Derive standardized navigation payload mapping UI elements to route descriptors
  const links = [
    { icon: <HomeIcon />, label: 'Tracker', path: '/' },
    { icon: <LeaderboardIcon />, label: 'Leaderboard', path: '/leaderboard' },
    { 
      icon: <UsersIcon />, 
      label: 'Travel Mates', 
      path: '/friends',
      rightSection: pendingCount > 0 ? <Badge size="sm" color="red" variant="filled" circle>{pendingCount}</Badge> : undefined
    },
    { icon: <GroupIcon />, label: 'Groups', path: '/groups' },
    { icon: <SettingsIcon />, label: 'Settings', path: '/settings' },
  ];

  const isLoginPage = !user;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={
        isLoginPage
          ? undefined
          : {
              width: 250,
              breakpoint: 'sm',
              collapsed: { mobile: !opened },
            }
      }
      padding="md"
    >
      <AppShell.Header style={{ overflow: 'hidden' }}>
        {/* Vintage Par Avion airmail trim across the top of the global shell header */}
        <div className="airmail-border" />
        <Group h="calc(100% - 6px)" px="md" justify="space-between">
          <Group gap="sm">
            {!isLoginPage && <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: '#1D3557',
                color: '#FAF6EE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(29, 53, 87, 0.2)',
              }}
            >
              <MapIcon />
            </div>
            <div>
              <Group gap={8} align="baseline">
                <Title order={3} style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                  World Tracker
                </Title>
                <Badge
                  size="xs"
                  variant="outline"
                  color="postmark-red"
                  visibleFrom="xs"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', letterSpacing: '1px' }}
                >
                  PAR AVION
                </Badge>
              </Group>
            </div>
          </Group>
          <ActionIcon
            variant="default"
            onClick={() => toggleColorScheme()}
            size="lg"
            aria-label="Toggle color scheme"
            style={{
              borderColor: 'light-dark(#DFD5C0, #2A3B5C)',
              backgroundColor: 'light-dark(#FAF6EE, #16213A)',
            }}
          >
            {colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      {!isLoginPage && (
        <AppShell.Navbar p="md">
          <AppShell.Section grow>
            <Text
              size="xs"
              fw={700}
              tt="uppercase"
              c="dimmed"
              mb="xs"
              px="xs"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', letterSpacing: '1.2px' }}
            >
              Traveler Logbook
            </Text>
            {links.map((link) => (
              <NavLink
                key={link.path}
                variant="filled"
                color="passport-navy"
                active={pathname === link.path}
                label={link.label}
                leftSection={link.icon}
                rightSection={link.rightSection}
                onClick={() => {
                  router.push(link.path);
                  close();
                }}
                mb="xs"
                style={{ borderRadius: '8px', fontWeight: pathname === link.path ? 700 : 500 }}
              />
            ))}
          </AppShell.Section>
          <AppShell.Section
            style={{
              borderTop: '1px dashed light-dark(#DFD5C0, #2A3B5C)',
              paddingTop: '12px',
            }}
          >
            <Anchor
              component={Link}
              href={`/profile/${user.uid}`}
              underline="never"
              c="inherit"
              style={{
                display: 'block',
                marginBottom: '12px',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: 'light-dark(#FFFDF9, #16213A)',
                border: '1px solid light-dark(#DFD5C0, #2A3B5C)',
              }}
            >
              <Group gap="sm" wrap="nowrap">
                {user.photoURL && <img src={user.photoURL} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1D3557' }} />}
                <div style={{ overflow: 'hidden' }}>
                  <Text size="sm" fw={600} truncate="end">{user.displayName || user.email}</Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.68rem' }}>
                    VIEW PASSPORT →
                  </Text>
                </div>
              </Group>
            </Anchor>
            <Button variant="light" color="red" fullWidth onClick={logOut}>
              Sign Out
            </Button>
          </AppShell.Section>
        </AppShell.Navbar>
      )}

      <AppShell.Main style={isLoginPage ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
