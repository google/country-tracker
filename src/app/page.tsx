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

import { useAuth } from '@/lib/AuthContext';
import CountryTracker from '@/components/CountryTracker';
import { Title, Center, Container, Button, Group } from '@mantine/core';
import Link from 'next/link';

/** JSDoc
 * The primary dashboard view rendered at the application root (`/`).
 * Mounts the core interactive mapping and country-tracking functionalities.
 * Assumes the user is globally authenticated via the shell layout context.
 */
export default function Home() {
  const { user } = useAuth();

  if (!user) return null; // Let the AuthProvider handle the redirect

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md" align="center">
        <Title order={1}>My Dashboard</Title>
        <Button component={Link} href={`/profile/${user.uid}`} variant="light" color="digital-atlas-cyan">
          Share My Passport
        </Button>
      </Group>
      <CountryTracker userId={user.uid} />
    </Container>
  );
}
