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

import { pocketbaseGroupRepository } from '@/lib/services/pocketbase/groupRepository';
import PocketBase from 'pocketbase';

// Mock PocketBase
jest.mock('pocketbase', () => jest.fn());

describe('PocketBaseGroupRepository', () => {
  let mockPb: any;
  const originalEnv = process.env;
  const groupId = 'group123';
  const userId = 'user123';

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
      getList: jest.fn(),
    };
    
    (PocketBase as unknown as jest.Mock).mockImplementation(() => mockPb);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createGroup', () => {
    it('creates group and members', async () => {
      mockPb.create.mockResolvedValueOnce({ id: groupId }); // For group creation
      mockPb.create.mockResolvedValue({}); // For member creation

      const id = await pocketbaseGroupRepository.createGroup('Test Group', 'Desc', userId, ['user2']);
      
      expect(id).toBe(groupId);
      expect(mockPb.collection).toHaveBeenCalledWith('groups');
      expect(mockPb.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Group' }));
      expect(mockPb.collection).toHaveBeenCalledWith('group_members');
      expect(mockPb.create).toHaveBeenCalledTimes(3); // 1 group + 2 members (owner + user2)
    });
  });

  describe('getUserGroups', () => {
    it('fetches and maps groups', async () => {
      mockPb.getFullList.mockResolvedValue([
        { role: 'owner', expand: { groupId: { id: groupId, name: 'Group 1' } } }
      ]);

      const groups = await pocketbaseGroupRepository.getUserGroups(userId);
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Group 1');
      expect(groups[0].myRole).toBe('owner');
    });

    it('filters out broken expands', async () => {
      mockPb.getFullList.mockResolvedValue([
        { role: 'owner', expand: {} } // Missing groupId
      ]);

      const groups = await pocketbaseGroupRepository.getUserGroups(userId);
      expect(groups).toHaveLength(0);
    });
  });

  describe('getGroupById', () => {
    it('fetches record', async () => {
      mockPb.getOne.mockResolvedValue({ id: groupId });
      const res = await pocketbaseGroupRepository.getGroupById(groupId);
      expect(res.id).toBe(groupId);
    });

    it('returns null on failure', async () => {
      mockPb.getOne.mockRejectedValue(new Error('Not found'));
      const res = await pocketbaseGroupRepository.getGroupById(groupId);
      expect(res).toBeNull();
    });
  });

  describe('getGroupMemberDetails', () => {
    it('fetches first list item', async () => {
      mockPb.getFirstListItem.mockResolvedValue({ role: 'member' });
      const res = await pocketbaseGroupRepository.getGroupMemberDetails(groupId, userId);
      expect(res.role).toBe('member');
    });

    it('returns null on failure', async () => {
      mockPb.getFirstListItem.mockRejectedValue(new Error('Not found'));
      const res = await pocketbaseGroupRepository.getGroupMemberDetails(groupId, userId);
      expect(res).toBeNull();
    });
  });

  describe('addMembersToGroup', () => {
    it('creates members and updates count', async () => {
      mockPb.getOne.mockResolvedValue({ memberCount: 1 });
      await pocketbaseGroupRepository.addMembersToGroup(groupId, ['user2']);
      expect(mockPb.create).toHaveBeenCalled();
      expect(mockPb.update).toHaveBeenCalledWith(groupId, { memberCount: 2 });
    });

    it('does nothing if empty list', async () => {
      await pocketbaseGroupRepository.addMembersToGroup(groupId, []);
      expect(mockPb.create).not.toHaveBeenCalled();
    });
  });

  describe('removeUserFromGroup', () => {
    it('deletes member and updates count', async () => {
      mockPb.getFirstListItem.mockResolvedValue({ id: 'mem1' });
      mockPb.getOne.mockResolvedValue({ memberCount: 2 });
      await pocketbaseGroupRepository.removeUserFromGroup(groupId, userId);
      expect(mockPb.delete).toHaveBeenCalledWith('mem1');
      expect(mockPb.update).toHaveBeenCalledWith(groupId, { memberCount: 1 });
    });

    it('ignores if member not found', async () => {
      mockPb.getFirstListItem.mockRejectedValue(new Error('Not found'));
      await pocketbaseGroupRepository.removeUserFromGroup(groupId, userId);
      expect(mockPb.delete).not.toHaveBeenCalled();
    });
  });

  describe('searchPublicGroups', () => {
    it('queries with filter', async () => {
      mockPb.getList.mockResolvedValue({
        items: [{ id: groupId, name: 'Public Group' }],
        page: 1,
        totalPages: 1
      });

      const res = await pocketbaseGroupRepository.searchPublicGroups('Public');
      expect(res.groups).toHaveLength(1);
      expect(res.groups[0].name).toBe('Public Group');
    });
  });

  describe('updateGroupLeaderboardPrivacy', () => {
    it('updates member record', async () => {
      mockPb.getFirstListItem.mockResolvedValue({ id: 'mem1' });
      await pocketbaseGroupRepository.updateGroupLeaderboardPrivacy(groupId, userId, 'anonymous');
      expect(mockPb.update).toHaveBeenCalledWith('mem1', { leaderboardVisibility: 'anonymous' });
    });
  });

  describe('transferGroupOwnership', () => {
    it('updates group and member roles', async () => {
      mockPb.getFirstListItem.mockResolvedValueOnce({ id: 'mem1' }); // old owner
      mockPb.getFirstListItem.mockResolvedValueOnce({ id: 'mem2' }); // new owner

      await pocketbaseGroupRepository.transferGroupOwnership(groupId, 'old', 'new');
      
      expect(mockPb.update).toHaveBeenCalledWith(groupId, { ownerId: 'new' });
      expect(mockPb.update).toHaveBeenCalledWith('mem1', { role: 'admin' });
      expect(mockPb.update).toHaveBeenCalledWith('mem2', { role: 'owner' });
    });
  });

  describe('updateGroupDetails', () => {
    it('updates group fields', async () => {
      await pocketbaseGroupRepository.updateGroupDetails(groupId, 'New Name', 'New Desc');
      expect(mockPb.update).toHaveBeenCalledWith(groupId, {
        name: 'New Name',
        searchName: 'new name',
        description: 'New Desc'
      });
    });
  });
});
