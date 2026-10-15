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

import { IGroupRepository, GroupData } from '../interfaces';
import { getPb } from './client';

/** JSDoc
 * PocketBase implementation of the IGroupRepository contract.
 */
export const pocketbaseGroupRepository: IGroupRepository = {
  async createGroup(name: string, description: string, ownerId: string, memberIds: string[], visibility: 'public' | 'private' = 'private') {
    const pb = getPb();
    const finalMembers = Array.from(new Set([ownerId, ...memberIds]));
    
    // Create group
    const group = await pb.collection('groups').create({
      name,
      searchName: name.toLowerCase(),
      description,
      ownerId,
      visibility,
      memberCount: finalMembers.length
    });

    const groupId = group.id;

    // Create group members mapping sequentially in MVP since full transaction APIs are isolated
    await Promise.all(finalMembers.map(userId => {
      const role = userId === ownerId ? 'owner' : 'member';
      return pb.collection('group_members').create({
        groupId,
        userId,
        role,
        joinedAt: new Date().toISOString()
      });
    }));

    return groupId;
  },

  async getUserGroups(userId: string) {
    const pb = getPb();
    // Fetch memberships and natively expand the relational group pointer in exact O(1) ops
    const memberships = await pb.collection('group_members').getFullList({
      filter: `userId = "${userId}"`,
      expand: 'groupId'
    });
    
    return memberships.map(m => ({
      id: m.expand?.groupId?.id,
      name: m.expand?.groupId?.name,
      description: m.expand?.groupId?.description,
      visibility: m.expand?.groupId?.visibility,
      memberCount: m.expand?.groupId?.memberCount,
      myRole: m.role,
      myVisibility: m.leaderboardVisibility
    })).filter(g => g.id); // Filter broken link pointers cleanly
  },

  async getGroupById(groupId: string) {
    const pb = getPb();
    try {
      return await pb.collection('groups').getOne(groupId);
    } catch {
      return null;
    }
  },

  async getGroupMemberDetails(groupId: string, userId: string) {
    const pb = getPb();
    try {
      return await pb.collection('group_members').getFirstListItem(`groupId = "${groupId}" && userId = "${userId}"`);
    } catch {
      return null;
    }
  },

  async getGroupMembers(groupId: string) {
    const pb = getPb();
    return await pb.collection('group_members').getFullList({
      filter: `groupId = "${groupId}"`
    });
  },

  async addMembersToGroup(groupId: string, newMemberIds: string[]) {
    const pb = getPb();
    if (newMemberIds.length === 0) return;

    await Promise.all(newMemberIds.map(userId => 
      pb.collection('group_members').create({
        groupId,
        userId,
        role: 'member',
        joinedAt: new Date().toISOString()
      })
    ));

    // Update member count
    const group = await pb.collection('groups').getOne(groupId);
    await pb.collection('groups').update(groupId, {
      memberCount: (group.memberCount || 0) + newMemberIds.length
    });
  },

  async removeUserFromGroup(groupId: string, userId: string) {
    const pb = getPb();
    try {
      const member = await pb.collection('group_members').getFirstListItem(`groupId = "${groupId}" && userId = "${userId}"`);
      await pb.collection('group_members').delete(member.id);
      
      // Update member count
      const group = await pb.collection('groups').getOne(groupId);
      await pb.collection('groups').update(groupId, {
        memberCount: Math.max(0, (group.memberCount || 1) - 1)
      });
    } catch {
      // Ignore if not present
    }
  },

  async searchPublicGroups(searchTerm: string, pageSize: number = 20, lastVisible: any = null) {
    const pb = getPb();
    
    // Fallback to offset pagination leveraging page indices natively in PocketBase
    const page = typeof lastVisible === 'number' ? lastVisible : 1;
    const filter = `visibility = "public" ${searchTerm ? `&& name ~ "${searchTerm}"` : ''}`;
    
    const resultList = await pb.collection('groups').getList(page, pageSize, {
      filter: filter,
      sort: '-created',
    });

    return {
      groups: resultList.items,
      nextCursor: resultList.page < resultList.totalPages ? resultList.page + 1 : null
    };
  },

  async joinPublicGroup(groupId: string, userId: string) {
    await this.addMembersToGroup(groupId, [userId]);
  },

  async updateGroupLeaderboardPrivacy(groupId: string, userId: string, visibility: 'public' | 'anonymous' | 'inherit') {
    const pb = getPb();
    const member = await pb.collection('group_members').getFirstListItem(`groupId = "${groupId}" && userId = "${userId}"`);
    
    await pb.collection('group_members').update(member.id, {
      leaderboardVisibility: visibility === 'inherit' ? null : visibility
    });
  },

  async transferGroupOwnership(groupId: string, oldOwnerId: string, newOwnerId: string) {
    const pb = getPb();
    // Update group owner
    await pb.collection('groups').update(groupId, { ownerId: newOwnerId });
    
    // Update roles in group_members
    const oldOwner = await pb.collection('group_members').getFirstListItem(`groupId = "${groupId}" && userId = "${oldOwnerId}"`);
    const newOwner = await pb.collection('group_members').getFirstListItem(`groupId = "${groupId}" && userId = "${newOwnerId}"`);
    
    await pb.collection('group_members').update(oldOwner.id, { role: 'admin' });
    await pb.collection('group_members').update(newOwner.id, { role: 'owner' });
  },

  async updateGroupDetails(groupId: string, name: string, description: string) {
    const pb = getPb();
    await pb.collection('groups').update(groupId, {
      name,
      searchName: name.toLowerCase(),
      description
    });
  },
};
