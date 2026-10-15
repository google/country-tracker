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

import { useState } from 'react';
import { Alert, Button, Card, Container, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useAuth } from '@/lib/AuthContext';

const isFirebase = process.env.NEXT_PUBLIC_BACKEND_TYPE === 'firebase';

/** JSDoc
 * The public entry point for unauthenticated traffic.
 * Generates the central Auth portal using Mantine styling overrides.
 * Uses Google OAuth for Firebase backend, and email/password authentication for PocketBase.
 */
export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123456');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (err: any) {
      const message = err?.message || 'Failed to authenticate';
      if (message.includes('Fetch') || message.includes('failed to fetch') || err?.status === 0) {
        setError('Could not connect to PocketBase server at ' + (process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090') + '. Please ensure PocketBase is running.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="xs" w="100%" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card 
        shadow="xl" 
        p="xl" 
        radius="lg" 
        withBorder 
        style={{ 
          textAlign: 'center', 
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at top left, light-dark(rgba(0,182,207,0.1), rgba(0,182,207,0.05)) 0%, transparent 40%), radial-gradient(circle at bottom right, light-dark(rgba(65,98,159,0.1), rgba(65,98,159,0.05)) 0%, transparent 40%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        
        <Stack gap="lg" align="center" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            padding: '1rem',
            borderRadius: '50%',
            background: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
            boxShadow: 'var(--mantine-shadow-sm)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-digital-atlas-cyan-6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"/>
              <path d="M9 4v13"/>
              <path d="M15 7v13"/>
            </svg>
          </div>
          
          <Title order={2} style={{ fontSize: '2rem' }}>World Tracker</Title>
          <Text c="dimmed" size="md" mb="sm">
            Track the countries you've explored and see where you rank against the rest of the world.
          </Text>

          {error && (
            <Alert color="red" w="100%" style={{ textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          {isFirebase ? (
            <Button 
              fullWidth 
              size="xl" 
              radius="md" 
              onClick={handleGoogleSubmit}
              loading={submitting}
              variant="filled" 
              color="digital-atlas-cyan"
            >
              Sign in with Google
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
              <Stack gap="md" w="100%">
                <TextInput
                  label="Email"
                  placeholder="demo@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button 
                  type="submit"
                  fullWidth 
                  size="md" 
                  radius="md" 
                  loading={submitting}
                  variant="filled" 
                  color="digital-atlas-cyan"
                >
                  Sign In / Register
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Card>
    </Container>
  );
}
