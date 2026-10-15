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

import '@mantine/core/styles.css';
import type { Metadata } from 'next';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Inter } from 'next/font/google';
import { theme } from '../theme';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import AppShellLayout from '@/components/AppShellLayout';
import PwaRegistrar from '@/components/PwaRegistrar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'World Tracker',
  description: 'Track the countries you have visited and compete on the leaderboard.',
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'World Tracker Passport',
    description: 'Explore my localized map of visited countries and global tracking stats!',
    siteName: 'World Tracker',
    images: [
      {
        url: '/globe.svg',
        width: 1200,
        height: 630,
        alt: 'World Tracker Map Preview',
      },
    ],
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Tracker Passport',
    description: 'Explore my localized map of visited countries and global tracking stats!',
    images: ['/globe.svg'],
  },
};

/** JSDoc
 * The absolute top-level Next.js layout boundary wrapper.
 * Initializes the React DOM tree with strictly ordered context providers:
 * 1. MantineProvider (Design System, Context Variables)
 * 2. AuthProvider (Global Session State)
 * 3. AppShellLayout (Navigation and persistent sidebar structural constraints)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <AuthProvider>
            <AppShellLayout>
              {children}
            </AppShellLayout>
          </AuthProvider>
        </MantineProvider>
        <PwaRegistrar />
      </body>
    </html>
  );
}
