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

import type { Metadata, ResolvingMetadata } from 'next';
import { fetchPublicProfile } from '@/app/actions/profile';

type Props = {
  params: Promise<{ uid: string }>;
  children: React.ReactNode;
};

/** JSDoc
 * Generates dynamic OpenGraph and Twitter Metadata tags executed strictly on the Next.js SSR engine natively.
 * Maps dynamic social sharing cards rendering the exact user name and country counts for seamless iMessage/Twitter linking.
 * 
 * NOTE: The SSR fetch context operates completely decoupled from the client session (Unauthenticated footprint).
 * Depending on `firestore.rules`, if the profile is heavily locked down, this will transparently fail over to secure fallbacks preventing data leakage.
 */
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const uid = resolvedParams.uid;
  
  // Scrapers access public URLs unauthenticated. This fires our secure action cleanly.
  const profileData = await fetchPublicProfile(uid);

  // If the profile query was rejected securely (privacy bounds or Firestore auth locks), serve generic fallback
  if (!profileData || profileData.error) {
    return {
      title: 'Private Traveler Passport',
      description: 'Sign in or request access to securely view this private travel log.',
    };
  }

  // Generate dynamic strings interpolating the scraped profile values safely
  const name = profileData.displayName || 'Anonymous Traveler';
  const count = profileData.visitedCountries?.length || 0;
  const titleString = `${name}'s Travel Passport | ${count} Countries`;
  const descString = `Check out ${name}'s personal world map tracking ${count} countries around the globe!`;
  
  return {
    title: titleString,
    description: descString,
    openGraph: {
      title: titleString,
      description: descString,
      images: [
        {
          url: profileData.photoURL || '/globe.svg',
          width: 1200,
          height: 630,
          alt: `${name}'s Profile Identity`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleString,
      description: descString,
      images: [profileData.photoURL || '/globe.svg'],
    },
  };
}

/** JSDoc
 * Transparent layout boundary encapsulating the dynamic client component inside Next 14+ routing semantics.
 */
export default function ProfileLayout({ children }: Props) {
  return <>{children}</>;
}
