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

import { countries, Country, filterActiveVisitedCountries } from '@/data/countries';

/** JSDoc
 * Processes raw user documents from Firestore into a sanitized and ranked leaderboard.
 * Evaluates individual user privacy settings (e.g., public, friends-only, anonymous) against
 * the requesting user's relationship to them. 
 *
 * @param docs - Raw Firestore user documents.
 * @param currentUserId - The ID of the authenticated user requesting the leaderboard.
 * @param friendIds - A set of validated friend UIDs for the authenticated user.
 * @param visibilityOverrides - Optional map mapping a specific user to a group-level privacy override.
 * @param isAdminContext - Whether the current context grants admin-level visibility to bypass rules.
 * @param activeCountries - Optional active country list to filter visited codes against (defaults to configured countries).
 * @returns Array of sorted, securely sanitized leaderboard entries.
 */
export function processLeaderboardDocs(
  docs: any[], 
  currentUserId?: string, 
  friendIds?: Set<string>,
  visibilityOverrides?: Map<string, string>,
  isAdminContext: boolean = false,
  activeCountries: Country[] = countries
) {
  const friendSet = friendIds || new Set<string>();
  
  // Pass 1: Construct an array with intermediate visibility flags
  const rawList = docs.map(doc => {
    const data = doc;
    const isCurrentUser = data.uid === currentUserId;
    
    // Determine target global privacy setting
    let lbPrivacy = data.privacy?.globalLeaderboard || 'public';
    // If a granular group-level override exists (e.g., 'anonymous'), apply it explicitly.
    if (visibilityOverrides && visibilityOverrides.has(data.uid)) {
      lbPrivacy = visibilityOverrides.get(data.uid)!;
    }
    // Handle backwards compatibility for arbitrary 'visible' flags mapping to 'public'
    if (lbPrivacy === 'visible') lbPrivacy = 'public';
    
    const profilePrivacy = data.privacy?.profileVisibility || 'public';

    // Establish if the user's score/name should be rendered on the leaderboard
    let lbVisible = false;
    if (isCurrentUser) {
      lbVisible = true;
    } else if (lbPrivacy === 'public') {
      lbVisible = true;
    } else if (lbPrivacy === 'friends' && friendSet.has(data.uid)) {
      lbVisible = true;
    }

    // Establish if the user's detailed profile page can be accessed from the leaderboard link
    let profileAccessible = false;
    if (isCurrentUser) {
      profileAccessible = true;
    } else if (profilePrivacy === 'public') {
      profileAccessible = true;
    } else if (profilePrivacy === 'friends' && friendSet.has(data.uid)) {
      profileAccessible = true;
    }

    // A user's internal UID is exposed only when both their LB standing and Profile are mutually public
    let exposeUid = lbVisible && profileAccessible;

    // Owners and Admins viewing a group leaderboard bypass standardized visibility limits
    if (isAdminContext) {
      lbVisible = true;
      profileAccessible = true;
      exposeUid = true;
    }

    // Filter visitedCountries against the active country list when configured so that
    // removing a country from config/countries.json automatically adjusts leaderboard scores.
    const rawVisited: string[] = data.visitedCountries || [];
    const activeVisited =
      activeCountries.length > 0
        ? filterActiveVisitedCountries(rawVisited, activeCountries)
        : rawVisited;

    return {
      uid_internal: data.uid,
      exposeUid,
      lbVisible,
      displayName: data.displayName || 'Anonymous',
      photoURL: data.photoURL,
      count: activeVisited.length,
      isPrivateMode: isCurrentUser && lbPrivacy === 'anonymous'
    };
  });

  // Sort descending by visited country count
  rawList.sort((a, b) => b.count - a.count);

  // Pass 2: Project mapped values into the final serialized shapes
  return rawList.map((entry, index) => ({
    uid: entry.exposeUid ? entry.uid_internal : null,
    // Assign a predictable but non-sensitive key for React mapping when a user is obscured
    idKey: entry.exposeUid ? entry.uid_internal : `anon_${index}`,
    // Obscure username if privacy dictates
    displayName: entry.lbVisible ? entry.displayName : 'Anonymous Explorer',
    // Strip avatar if privacy dictates
    photoURL: entry.lbVisible ? entry.photoURL : null,
    count: entry.count,
    isPrivateMode: entry.isPrivateMode
  }));
}
