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

import Link from 'next/link';
import { Title, Text, Button, Container, Group, Center, Stack } from '@mantine/core';

/** JSDoc
 * Next.js native 404 (Not Found) fallback layout boundary.
 * Renders automatically whenever the App Router fails to explicitly map a requested route, 
 * or if a dynamic segment intentionally triggers the `notFound()` hook dynamically.
 */
export default function NotFound() {
  return (
    <Container py={120}>
      <Center>
        <Stack align="center" ta="center" gap="md">
          <Title order={1} size="5rem" c="digital-atlas-cyan" style={{ lineHeight: 1 }}>
            404
          </Title>
          <Title order={2}>Off the Grid</Title>
          <Text c="dimmed" maw={500} size="lg" mt="xs">
            Looks like you've wandered into uncharted territory. This flight path doesn't exist on our global tracker map.
          </Text>
          <Group mt="xl">
            <Link href="/" passHref style={{ textDecoration: 'none' }}>
              <Button size="md" radius="md" color="digital-atlas-blue">
                Return Home
              </Button>
            </Link>
          </Group>
        </Stack>
      </Center>
    </Container>
  );
}
