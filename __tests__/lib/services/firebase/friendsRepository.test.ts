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

import { firebaseFriendsRepository } from '@/lib/services/firebase/friendsRepository';
import { db } from '@/lib/services/firebase/client';
import { addDoc, getDocs, getDoc, updateDoc, deleteDoc, collection, doc, query, where, serverTimestamp } from 'firebase/firestore';

jest.mock('@/lib/services/firebase/client', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ type: 'document' })),
  collection: jest.fn(() => ({ type: 'collection' })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => 'test_timestamp'),
}));

describe('FirebaseFriendsRepository', () => {
  const reqId = 'req123';
  const userId = 'user123';
  const friendId = 'friend123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchUserByEmail', () => {
    it('returns a user if found', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [ { data: () => ({ email: 'test@example.com' }) } ]
      });
      const user = await firebaseFriendsRepository.searchUserByEmail('test@example.com');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('returns null if no user found', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });
      const user = await firebaseFriendsRepository.searchUserByEmail('unknown@example.com');
      expect(user).toBeNull();
    });
  });

  describe('sendFriendRequest', () => {
    it('throws error if requesting self', async () => {
      await expect(firebaseFriendsRepository.sendFriendRequest(userId, userId)).rejects.toThrow("You cannot add yourself.");
    });

    it('adds request if not existing', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });
      await firebaseFriendsRepository.sendFriendRequest(userId, friendId);
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('acceptFriendRequest', () => {
    it('updates request status', async () => {
      await firebaseFriendsRepository.acceptFriendRequest(reqId);
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'accepted' });
    });
  });

  describe('declineFriendRequest', () => {
    it('deletes request', async () => {
      await firebaseFriendsRepository.declineFriendRequest(reqId);
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('getFriends', () => {
    it('fetches accepted friends', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [ { id: reqId, data: () => ({ requesterId: userId, receiverId: friendId, status: 'accepted' }) } ]
      });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ email: 'friend@example.com' })
      });

      const friends = await firebaseFriendsRepository.getFriends(userId);
      expect(friends).toHaveLength(2); // Since Promise.all mocks getDocs twice
    });
  });
});
