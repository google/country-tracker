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

import { firebaseGroupRepository } from '@/lib/services/firebase/groupRepository';
import { db } from '@/lib/services/firebase/client';
import { collection, addDoc, getDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';

jest.mock('@/lib/services/firebase/client', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => {
  const orig = jest.requireActual('firebase/firestore');
  const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn()
  };
  return {
    ...orig,
    collection: jest.fn(() => ({ type: 'collection' })),
    doc: jest.fn((_, __, id) => id ? { id, type: 'document' } : { type: 'document' }),
    addDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    writeBatch: jest.fn(() => mockBatch),
    serverTimestamp: jest.fn(() => 'timestamp'),
    query: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn()
  };
});

describe('FirebaseGroupRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create group document and assign members via batch', async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: 'group1' });
      const mockBatch = writeBatch(db);

      await firebaseGroupRepository.createGroup('Euro Trip', 'Desc', 'user1', ['user2'], 'public');

      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'Euro Trip',
        searchName: 'euro trip',
        visibility: 'public',
        ownerId: 'user1',
        memberCount: 2
      }));

      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('addMembersToGroup', () => {
    it('should incrementally add members and increase count', async () => {
      const mockBatch = writeBatch(db);
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ memberCount: 5 })
      });

      await firebaseGroupRepository.addMembersToGroup('group1', ['user3']);

      expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        userId: 'user3',
        groupId: 'group1',
        role: 'member'
      }));
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        memberCount: 6
      });
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('removeUserFromGroup', () => {
    it('should incrementally remove member and decrease count', async () => {
      const mockBatch = writeBatch(db);
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ memberCount: 2 })
      });

      await firebaseGroupRepository.removeUserFromGroup('group1', 'user3');

      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
        memberCount: 1
      });
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getGroupById', () => {
    it('should fetch group data correctly', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'group1',
        data: () => ({ name: 'A Group' })
      });

      const res = await firebaseGroupRepository.getGroupById('group1');
      expect(res?.id).toBe('group1');
      expect(res?.name).toBe('A Group');
    });

    it('should return null if group does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const res = await firebaseGroupRepository.getGroupById('nonexistent');
      expect(res).toBeNull();
    });
  });

  describe('searchPublicGroups', () => {
    it('should return paginated groups and nextCursor', async () => {
      const { getDocs } = require('firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { id: 'group1', data: () => ({ name: 'Group A', visibility: 'public' }) },
          { id: 'group2', data: () => ({ name: 'Group B', visibility: 'public' }) }
        ]
      });

      const res = await firebaseGroupRepository.searchPublicGroups('Group', 1);
      expect(res.groups.length).toBe(1);
      expect(res.groups[0].name).toBe('Group A');
      expect(res.nextCursor).toBeTruthy();
    });

    it('should not filter if searchTerm is empty', async () => {
      const { getDocs } = require('firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { id: 'group1', data: () => ({ name: 'Group A', visibility: 'public' }) }
        ]
      });

      const res = await firebaseGroupRepository.searchPublicGroups('', 10);
      expect(res.groups.length).toBe(1);
    });

    it('should use startAfter if lastVisible is provided', async () => {
      const { getDocs, query, startAfter } = require('firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: []
      });

      await firebaseGroupRepository.searchPublicGroups('', 10, { id: 'lastDoc' });
      expect(startAfter).toHaveBeenCalled();
    });
  });

  describe('joinPublicGroup', () => {
    it('should throw error if group is not public', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ visibility: 'private' })
      });

      await expect(firebaseGroupRepository.joinPublicGroup('group1', 'user1'))
        .rejects.toThrow('Group is not public or does not exist');
    });

    it('should add member if group is public', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ visibility: 'public' })
      });
      const mockBatch = writeBatch(db);

      await firebaseGroupRepository.joinPublicGroup('group1', 'user1');

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('updateGroupLeaderboardPrivacy', () => {
    it('should update leaderboard visibility', async () => {
      await firebaseGroupRepository.updateGroupLeaderboardPrivacy('group1', 'user1', 'anonymous');
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { leaderboardVisibility: 'anonymous' });
    });

    it('should set leaderboard visibility to null if inherit', async () => {
      await firebaseGroupRepository.updateGroupLeaderboardPrivacy('group1', 'user1', 'inherit');
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { leaderboardVisibility: null });
    });
  });

  describe('transferGroupOwnership', () => {
    it('should update group owner and member roles in batch', async () => {
      const mockBatch = writeBatch(db);
      await firebaseGroupRepository.transferGroupOwnership('group1', 'owner1', 'newOwner1');
      
      expect(mockBatch.update).toHaveBeenCalledTimes(3); // group, new owner, old owner
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('updateGroupDetails', () => {
    it('should update group name and description', async () => {
      await firebaseGroupRepository.updateGroupDetails('group1', 'New Name', 'New Desc');
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'New Name',
        searchName: 'new name',
        description: 'New Desc'
      }));
    });
  });

  describe('getUserGroups', () => {
    it('should fetch groups for user via memberships', async () => {
      const { getDocs, getDoc } = require('firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => ({ groupId: 'group1', role: 'member' }) }
        ]
      });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'group1',
        data: () => ({ name: 'Group A', visibility: 'public' })
      });

      const res = await firebaseGroupRepository.getUserGroups('user1');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('group1');
      expect(res[0].name).toBe('Group A');
      expect(res[0].myRole).toBe('member');
    });
  });

  describe('getGroupMemberDetails', () => {
    it('should return member details if exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'member' })
      });

      const res = await firebaseGroupRepository.getGroupMemberDetails('group1', 'user1');
      expect(res?.role).toBe('member');
    });

    it('should return null if member details do not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const res = await firebaseGroupRepository.getGroupMemberDetails('group1', 'user1');
      expect(res).toBeNull();
    });
  });

  describe('getGroupMembers', () => {
    it('should fetch members for group', async () => {
      const { getDocs } = require('firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => ({ userId: 'user1', role: 'owner' }) },
          { data: () => ({ userId: 'user2', role: 'member' }) }
        ]
      });

      const res = await firebaseGroupRepository.getGroupMembers('group1');
      expect(res.length).toBe(2);
      expect(res[0].userId).toBe('user1');
      expect(res[1].userId).toBe('user2');
    });
  });
});
