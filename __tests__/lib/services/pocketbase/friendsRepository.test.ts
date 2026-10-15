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

import { pocketbaseFriendsRepository } from '@/lib/services/pocketbase/friendsRepository';
import PocketBase from 'pocketbase';

// Mock PocketBase
jest.mock('pocketbase', () => jest.fn());

describe('PocketBaseFriendsRepository', () => {
  let mockPb: any;
  const originalEnv = process.env;
  const userId = 'user123';
  const friendId = 'friend123';
  const reqId = 'req123';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NEXT_PUBLIC_POCKETBASE_URL: 'http://127.0.0.1:8090' };
    
    mockPb = {
      collection: jest.fn().mockReturnThis(),
      create: jest.fn(),
      getFullList: jest.fn(),
      getOne: jest.fn(),
      getFirstListItem: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    
    (PocketBase as unknown as jest.Mock).mockImplementation(() => mockPb);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('searchUserByEmail', () => {
    it('returns user if found', async () => {
      mockPb.getFirstListItem.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
      const user = await pocketbaseFriendsRepository.searchUserByEmail('test@example.com');
      expect(user.id).toBe('u1');
    });

    it('returns null if not found', async () => {
      mockPb.getFirstListItem.mockRejectedValue(new Error('Not found'));
      const user = await pocketbaseFriendsRepository.searchUserByEmail('unknown@example.com');
      expect(user).toBeNull();
    });
  });

  describe('sendFriendRequest', () => {
    it('throws error if requesting self', async () => {
      await expect(pocketbaseFriendsRepository.sendFriendRequest(userId, userId)).rejects.toThrow("You cannot add yourself.");
    });

    it('creates request if not existing', async () => {
      mockPb.getFirstListItem.mockRejectedValue({ status: 404 });
      await pocketbaseFriendsRepository.sendFriendRequest(userId, friendId);
      expect(mockPb.create).toHaveBeenCalledWith(expect.objectContaining({ requesterId: userId, receiverId: friendId }));
    });

    it('throws error if request already exists', async () => {
      mockPb.getFirstListItem.mockResolvedValue({ id: reqId });
      await expect(pocketbaseFriendsRepository.sendFriendRequest(userId, friendId)).rejects.toThrow("A request already exists or you are already friends.");
    });

    it('throws error if getFirstListItem throws non-404', async () => {
      mockPb.getFirstListItem.mockRejectedValue({ status: 500 });
      await expect(pocketbaseFriendsRepository.sendFriendRequest(userId, friendId)).rejects.toEqual({ status: 500 });
    });
  });

  describe('getPendingRequests', () => {
    it('fetches and maps requests', async () => {
      mockPb.getFullList.mockResolvedValue([
        { id: reqId, expand: { requesterId: { id: 'u2', email: 'u2@example.com' } } }
      ]);

      const requests = await pocketbaseFriendsRepository.getPendingRequests(userId);
      expect(requests).toHaveLength(1);
      expect(requests[0].requester.email).toBe('u2@example.com');
    });
  });

  describe('acceptFriendRequest', () => {
    it('updates status', async () => {
      await pocketbaseFriendsRepository.acceptFriendRequest(reqId);
      expect(mockPb.update).toHaveBeenCalledWith(reqId, { status: 'accepted' });
    });
  });

  describe('declineFriendRequest', () => {
    it('deletes record', async () => {
      await pocketbaseFriendsRepository.declineFriendRequest(reqId);
      expect(mockPb.delete).toHaveBeenCalledWith(reqId);
    });
  });

  describe('getFriends', () => {
    it('fetches and maps accepted friends (as requester)', async () => {
      mockPb.getFullList.mockResolvedValue([
        { id: reqId, requesterId: userId, receiverId: friendId, expand: { receiverId: { id: friendId, email: 'friend@example.com' } } }
      ]);

      const friends = await pocketbaseFriendsRepository.getFriends(userId);
      expect(friends).toHaveLength(1);
      expect(friends[0].email).toBe('friend@example.com');
      expect(friends[0].friendshipId).toBe(reqId);
    });

    it('fetches and maps accepted friends (as receiver)', async () => {
      mockPb.getFullList.mockResolvedValue([
        { id: reqId, requesterId: friendId, receiverId: userId, expand: { requesterId: { id: friendId, email: 'friend@example.com' } } }
      ]);

      const friends = await pocketbaseFriendsRepository.getFriends(userId);
      expect(friends).toHaveLength(1);
      expect(friends[0].email).toBe('friend@example.com');
      expect(friends[0].friendshipId).toBe(reqId);
    });
  });

  describe('removeFriend', () => {
    it('deletes record', async () => {
      await pocketbaseFriendsRepository.removeFriend(reqId);
      expect(mockPb.delete).toHaveBeenCalledWith(reqId);
    });
  });
});
