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

import { collection, doc, addDoc, getDocs, getDoc, query, where, serverTimestamp, updateDoc, writeBatch, deleteDoc, limit, startAfter, orderBy, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './client';
import { IGroupRepository, GroupData } from '../interfaces';



/** JSDoc
 * Firebase implementation of the IGroupRepository contract.
 */
export const firebaseGroupRepository: IGroupRepository = {
  async createGroup(name: string, description: string, ownerId: string, memberIds: string[], visibility: 'public' | 'private' = 'private') {
    const finalMembers = Array.from(new Set([ownerId, ...memberIds]));
    
    const groupsRef = collection(db, 'groups');
    const groupDocRef = await addDoc(groupsRef, {
      name,
      searchName: name.toLowerCase(),
      description,
      ownerId,
      visibility,
      memberCount: finalMembers.length,
      createdAt: serverTimestamp()
    });

    const groupId = groupDocRef.id;

    const batch = writeBatch(db);
    const membersRef = collection(db, 'group_members');

    finalMembers.forEach((userId) => {
      const role = userId === ownerId ? 'owner' : 'member';
      const specificRef = doc(membersRef, `${groupId}_${userId}`);
      
      batch.set(specificRef, {
        groupId,
        userId,
        role,
        joinedAt: serverTimestamp()
      });
    });

    await batch.commit();
    return groupId;
  },

  async getUserGroups(userId: string) {
    const membersRef = collection(db, 'group_members');
    const q = query(membersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const results = [];
    for (const docSnap of querySnapshot.docs) {
      const memData = docSnap.data();
      const groupSnap = await getDoc(doc(db, 'groups', memData.groupId));
      
      if (groupSnap.exists()) {
        results.push({
          id: groupSnap.id,
          ...groupSnap.data(),
          myRole: memData.role,
          myVisibility: memData.leaderboardVisibility
        });
      }
    }
    
    return results;
  },

  async getGroupById(groupId: string) {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  },

  async getGroupMemberDetails(groupId: string, userId: string) {
    const specificRef = doc(db, 'group_members', `${groupId}_${userId}`);
    const snap = await getDoc(specificRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  },

  async getGroupMembers(groupId: string) {
    const membersRef = collection(db, 'group_members');
    const q = query(membersRef, where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  },

  async addMembersToGroup(groupId: string, newMemberIds: string[]) {
    if (newMemberIds.length === 0) return;
    
    const batch = writeBatch(db);
    const membersRef = collection(db, 'group_members');
    
    newMemberIds.forEach(userId => {
      const specificRef = doc(membersRef, `${groupId}_${userId}`);
      batch.set(specificRef, {
        groupId,
        userId,
        role: 'member',
        joinedAt: serverTimestamp()
      });
    });

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      batch.update(groupRef, {
        memberCount: (groupSnap.data().memberCount || 0) + newMemberIds.length
      });
    }

    await batch.commit();
  },

  async removeUserFromGroup(groupId: string, userId: string) {
    const specificRef = doc(db, 'group_members', `${groupId}_${userId}`);
    
    const batch = writeBatch(db);
    batch.delete(specificRef);

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      const currentCount = groupSnap.data().memberCount || 1;
      batch.update(groupRef, {
        memberCount: Math.max(0, currentCount - 1)
      });
    }

    await batch.commit();
  },

  async searchPublicGroups(searchTerm: string, pageSize: number = 20, lastVisible: any = null) {
    const groupsRef = collection(db, 'groups');
    
    const constraints: any[] = [
      where('visibility', '==', 'public'),
      limit(50)
    ];

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
    
    const q = query(groupsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    let groups = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as GroupData));
    
    const termLower = searchTerm.trim().toLowerCase();
    if (termLower) {
      groups = groups.filter(g => (g.name || '').toLowerCase().includes(termLower) || (g.searchName || '').includes(termLower));
    }

    const paginatedGroups = groups.slice(0, pageSize);
    
    const lastYieldedGroup = paginatedGroups.length > 0 ? paginatedGroups[paginatedGroups.length - 1] : null;
    const newLastVisible = lastYieldedGroup && querySnapshot.docs.length > 0 ? querySnapshot.docs.find(d => d.id === lastYieldedGroup.id) || null : null;

    return { groups: paginatedGroups, nextCursor: newLastVisible };
  },

  async joinPublicGroup(groupId: string, userId: string) {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists() || groupSnap.data().visibility !== 'public') {
      throw new Error('Group is not public or does not exist');
    }

    await this.addMembersToGroup(groupId, [userId]);
  },

  async updateGroupLeaderboardPrivacy(groupId: string, userId: string, visibility: 'public' | 'anonymous' | 'inherit') {
    const specificRef = doc(db, 'group_members', `${groupId}_${userId}`);
    const updatePayload = visibility === 'inherit' 
      ? { leaderboardVisibility: null }
      : { leaderboardVisibility: visibility };
      
    await updateDoc(specificRef, updatePayload as any);
  },

  async transferGroupOwnership(groupId: string, oldOwnerId: string, newOwnerId: string) {
    const batch = writeBatch(db);
    
    const groupRef = doc(db, 'groups', groupId);
    batch.update(groupRef, { ownerId: newOwnerId });

    const newOwnerRef = doc(db, 'group_members', `${groupId}_${newOwnerId}`);
    batch.update(newOwnerRef, { role: 'owner' });

    const oldOwnerRef = doc(db, 'group_members', `${groupId}_${oldOwnerId}`);
    batch.update(oldOwnerRef, { role: 'admin' });

    await batch.commit();
  },

  async updateGroupDetails(groupId: string, name: string, description: string) {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      name,
      searchName: name.toLowerCase(),
      description
    });
  },
};
