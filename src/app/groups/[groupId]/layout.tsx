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
import { ServiceRegistry } from '@/lib/services/registry';

const groupRepository = ServiceRegistry.getGroupRepository();

type Props = {
  params: Promise<{ groupId: string }>;
  children: React.ReactNode;
};

/** JSDoc
 * Intercepts group rendering pipeline to generate server-computed dynamic OpenGraph metadata strings
 * mapping exact travel group characteristics for rich sharing previews within iMessage, Slack, and social platforms.
 */
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const groupId = resolvedParams.groupId;
  
  // Note: `getGroupById` queries Firestore utilizing the unauthenticated Server instance cleanly.
  // Because Groups are heavily restricted under firestore.rules, if a group is completely public it might resolve (if rules allowed).
  // Otherwise, it returns generic generic previews mitigating unauthorized social leaking gracefully.
  let groupData = null;
  try {
    groupData = await groupRepository.getGroupById(groupId);
  } catch (err) {
    console.error("Layout failed to fetch metadata payload:", err);
  }

  // Deny explicit metadata scraping on invalid references or security exceptions implicitly locking it down.
  if (!groupData) {
    return {
      title: 'Private Travel Group',
      description: 'Sign in to join or view this specific country tracking circle.',
    };
  }

  const name = groupData.name || 'Anonymous Group';
  const members = groupData.memberCount || 0;
  
  const titleString = `${name} | Travel Group`;
  const descString = `Explore the ${name} leaderboard tracking international travel logs across ${members} members!`;
  
  return {
    title: titleString,
    description: descString,
    openGraph: {
      title: titleString,
      description: descString,
      images: [
        {
          url: '/globe.svg',
          width: 1200,
          height: 630,
          alt: `${name} Group Open Graph Reference`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleString,
      description: descString,
      images: ['/globe.svg'],
    },
  };
}

export default function GroupLayout({ children }: Props) {
  return <>{children}</>;
}
