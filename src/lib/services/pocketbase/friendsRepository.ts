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

import { IFriendsRepository } from '../interfaces';
import { getPb } from './client';

/** JSDoc
 * PocketBase implementation of the IFriendsRepository contract.
 */
export const pocketbaseFriendsRepository: IFriendsRepository = {
  async searchUserByEmail(email: string) {
    const pb = getPb();
    try {
      return await pb.collection('users').getFirstListItem(`email = "${email}"`);
    } catch {
      return null;
    }
  },

  async sendFriendRequest(requesterId: string, receiverId: string) {
    const pb = getPb();
    if (requesterId === receiverId) throw new Error("You cannot add yourself.");

    // Check existing request in either direction
    const filter = `(requesterId = "${requesterId}" && receiverId = "${receiverId}") || (requesterId = "${receiverId}" && receiverId = "${requesterId}")`;
    try {
      const existing = await pb.collection('friends').getFirstListItem(filter);
      if (existing) {
        throw new Error("A request already exists or you are already friends.");
      }
    } catch (err: any) {
      // 404 is expected if no prior relationship exists. Others are true errors.
      if (err.status !== 404) throw err;
    }

    await pb.collection('friends').create({
      requesterId,
      receiverId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  },

  async getPendingRequests(userId: string) {
    const pb = getPb();
    const records = await pb.collection('friends').getFullList({
      filter: `receiverId = "${userId}" && status = "pending"`,
      expand: 'requesterId'
    });
    
    return records.map(r => ({
      requester: r.expand?.requesterId,
      ...r
    }));
  },

  async acceptFriendRequest(requestId: string) {
    const pb = getPb();
    await pb.collection('friends').update(requestId, { status: 'accepted' });
  },

  async declineFriendRequest(requestId: string) {
    const pb = getPb();
    await pb.collection('friends').delete(requestId);
  },

  async getFriends(userId: string) {
    const pb = getPb();
    const filter = `(requesterId = "${userId}" || receiverId = "${userId}") && status = "accepted"`;
    const records = await pb.collection('friends').getFullList({
      filter: filter,
      expand: 'requesterId,receiverId'
    });
    
    return records.map(r => {
      const friend = r.requesterId === userId ? r.expand?.receiverId : r.expand?.requesterId;
      return {
        ...friend,
        friendshipId: r.id
      };
    });
  },

  async removeFriend(friendshipId: string) {
    const pb = getPb();
    await pb.collection('friends').delete(friendshipId);
  },
};
