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

'use server';

import { ServiceRegistry } from '@/lib/services/registry';
import { filterActiveVisitedCountries } from '@/data/countries';

const userRepository = ServiceRegistry.getUserRepository();
const friendsRepository = ServiceRegistry.getFriendsRepository();

/** JSDoc
 * Fetches the public-facing profile of a user based on their privacy settings.
 * Ensures that private profiles and friends-only profiles are strictly gated.
 */
export async function fetchPublicProfile(targetUid: string, requestingUid?: string) {
  try {
    const user = await userRepository.getProfile(targetUid);

    // Fail softly if the user ID could not be matched
    if (!user) {
      return { error: 'not_found' };
    }

    const data = user;
    const isOwner = requestingUid === targetUid;
    const visibility = data.privacy?.profileVisibility || 'public';

    // 2. Validate Profile Visibility Permissions
    // If the caller is not the profile owner, determine if access should be restricted
    if (!isOwner) {
      // Reject any non-owners attempting to view a fully private profile
      if (visibility === 'private') {
        return { error: 'private' };
      }

      // Restrict access to valid friends only
      if (visibility === 'friends') {
        // Disallow anonymous/logged-out visitors immediately
        if (!requestingUid) {
          return { error: 'private' };
        }

        // Verify bidirectional friendship securely via repository
        const friends = await friendsRepository.getFriends(requestingUid);
        const isFriend = friends.some(f => f.uid === targetUid || f.id === targetUid);
        
        if (!isFriend) {
          return { error: 'private' };
        }
      }
    }

    // 3. Success! Return a safely sanitized subset of the user record to prevent leaking private fields.
    // Filter visitedCountries against the active country configuration so removed countries do not skew counts.
    return {
      uid: data.uid || targetUid,
      displayName: data.displayName,
      photoURL: data.photoURL,
      visitedCountries: filterActiveVisitedCountries(data.visitedCountries || []),
      isOwner,
      visibility,
    };

  } catch (error) {
    console.error("Error securely fetching public profile:", error);
    return { error: 'server_error' };
  }
}
