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

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  globalLeaderboard: 'public' | 'friends' | 'anonymous';
}

export interface GroupData {
  id?: string;
  name: string;
  searchName: string;
  description: string;
  ownerId: string;
  visibility: 'public' | 'private';
  memberCount: number;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
}

export interface IAuthService {
  signIn(credentials?: AuthCredentials): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (user: AppUser | null) => void): () => void;
}

export interface IUserRepository {
  ensureProfile(user: AppUser): Promise<void>;
  getProfile(uid: string): Promise<any>;
  updatePrivacySettings(uid: string, privacy: PrivacySettings): Promise<void>;
  updateUserDisplayName(uid: string, displayName: string): Promise<void>;
  addVisitedCountry(uid: string, countryCode: string): Promise<void>;
  removeVisitedCountry(uid: string, countryCode: string): Promise<void>;
  getVisitedCountries(uid: string): Promise<string[]>;
  getLeaderboardData(): Promise<any[]>;
}

export interface IFriendsRepository {
  searchUserByEmail(email: string): Promise<any>;
  sendFriendRequest(requesterId: string, receiverId: string): Promise<void>;
  getPendingRequests(userId: string): Promise<any[]>;
  acceptFriendRequest(requestId: string): Promise<void>;
  declineFriendRequest(requestId: string): Promise<void>;
  getFriends(userId: string): Promise<any[]>;
  removeFriend(friendshipId: string): Promise<void>;
}

export interface IGroupRepository {
  createGroup(name: string, description: string, ownerId: string, memberIds: string[], visibility: 'public' | 'private'): Promise<string>;
  getUserGroups(uid: string): Promise<any[]>;
  getGroupById(groupId: string): Promise<any>;
  getGroupMemberDetails(groupId: string, userId: string): Promise<any>;
  getGroupMembers(groupId: string): Promise<any[]>;
  addMembersToGroup(groupId: string, newMemberIds: string[]): Promise<void>;
  removeUserFromGroup(groupId: string, userId: string): Promise<void>;
  searchPublicGroups(searchTerm: string, pageSize?: number, lastVisible?: any): Promise<{ groups: any[], nextCursor: any }>;
  joinPublicGroup(groupId: string, userId: string): Promise<void>;
  updateGroupLeaderboardPrivacy(groupId: string, userId: string, visibility: 'public' | 'anonymous' | 'inherit'): Promise<void>;
  transferGroupOwnership(groupId: string, oldOwnerId: string, newOwnerId: string): Promise<void>;
  updateGroupDetails(groupId: string, name: string, description: string): Promise<void>;
}
