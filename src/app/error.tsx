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

'use client'; // Next.js explicitly requires runtime error boundaries to execute in the client

import { useEffect } from 'react';
import { Container, Title, Text, Button, Center, Stack } from '@mantine/core';

/** JSDoc
 * Top-level application error boundary isolating unhandled UI errors gracefully.
 * Retains the AppShellLayout header so the user can natively continue moving off
 * a broken route back to a safe screen rather than receiving an unhandled raw crash dump natively.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Pipe the runtime exception natively to standard error tracking
    console.error("React Component Boundary Caught Unhandled Exception:", error);
  }, [error]);

  return (
    <Container py={100}>
      <Center>
        <Stack align="center" ta="center" gap="md">
          <Title order={1} c="red.6" size="3rem">
            Unexpected Turbulence
          </Title>
          <Text size="lg" c="dimmed" maw={600} mt="sm">
            Our tracker encountered a runtime fault while calculating this route. 
            Don't worry, your passport and saved country data are perfectly safe!
          </Text>
          <Button 
            variant="light" 
            color="digital-atlas-cyan" 
            size="md"
            radius="md"
            onClick={() => reset()} 
            mt="lg"
          >
            Attempt Route Reboot
          </Button>
        </Stack>
      </Center>
    </Container>
  );
}
