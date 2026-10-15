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
import { processLeaderboardDocs } from '@/lib/leaderboardUtils';

const userRepository = ServiceRegistry.getUserRepository();
const groupRepository = ServiceRegistry.getGroupRepository();
const friendsRepository = ServiceRegistry.getFriendsRepository();

/** JSDoc
 * Interrogates the friends repository to retrieve a full set of user IDs
 * representing all accepted friends for the given user.
 */
async function getUserFriendIds(userId: string): Promise<Set<string>> {
  const friends = await friendsRepository.getFriends(userId);
  const friendIds = new Set(friends.map(f => f.uid).filter(Boolean) as string[]);
  return friendIds;
}

/** JSDoc
 * Fetches the global leaderboard data, filtering user visibility securely on the server.
 */
export async function fetchSecureLeaderboard(currentUserId?: string) {
  try {
    const users = await userRepository.getLeaderboardData();
    
    let friendIds = new Set<string>();
    if (currentUserId) {
      friendIds = await getUserFriendIds(currentUserId);
    }
    
    return processLeaderboardDocs(users, currentUserId, friendIds);
  } catch (error) {
    console.error("Error securely fetching leaderboard:", error);
    throw new Error("Failed to fetch leaderboard data.");
  }
}

/** JSDoc
 * Fetches the members of a particular group and processes their scores into a localized leaderboard.
 */
export async function fetchGroupLeaderboard(currentUserId: string, groupId: string) {
  try {
    const members = await groupRepository.getGroupMembers(groupId);
    
    const visibilityOverrides = new Map<string, string>();
    const allMemberIds: string[] = [];
    let isAdminContext = false;
    
    members.forEach(data => {
      allMemberIds.push(data.userId);
      
      if (data.userId === currentUserId && (data.role === 'owner' || data.role === 'admin')) {
        isAdminContext = true;
      }
      
      if (data.leaderboardVisibility) {
        visibilityOverrides.set(data.userId, data.leaderboardVisibility);
      }
    });

    if (allMemberIds.length === 0) return [];

    const users = await userRepository.getLeaderboardData();
    const validGroupDocs = users.filter(u => allMemberIds.includes(u.uid));
    
    let friendIds = new Set<string>();
    if (currentUserId) {
      friendIds = await getUserFriendIds(currentUserId);
    }

    return processLeaderboardDocs(validGroupDocs, currentUserId, friendIds, visibilityOverrides, isAdminContext);
  } catch (error) {
    console.error("Error securely fetching group leaderboard:", error);
    throw new Error("Failed to fetch group leaderboard data.");
  }
}
