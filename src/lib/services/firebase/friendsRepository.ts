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

import { collection, doc, addDoc, getDocs, query, where, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './client';
import { IFriendsRepository } from '../interfaces';

/** JSDoc
 * Firebase implementation of the IFriendsRepository contract.
 */
export const firebaseFriendsRepository: IFriendsRepository = {
  async searchUserByEmail(email: string) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  },

  async sendFriendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) throw new Error("You cannot add yourself.");
    
    const friendsRef = collection(db, 'friends');
    
    const q1 = query(friendsRef, where('requesterId', '==', requesterId), where('receiverId', '==', receiverId));
    const q2 = query(friendsRef, where('requesterId', '==', receiverId), where('receiverId', '==', requesterId));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    if (!snap1.empty || !snap2.empty) {
      throw new Error("A request already exists or you are already friends.");
    }

    await addDoc(friendsRef, {
      requesterId,
      receiverId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  },

  async getPendingRequests(userId: string) {
    const friendsRef = collection(db, 'friends');
    const q = query(friendsRef, where('receiverId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const requests = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const requesterSnap = await getDoc(doc(db, 'users', data.requesterId));
      if (requesterSnap.exists()) {
        requests.push({
          id: docSnap.id,
          requester: requesterSnap.data(),
          ...data
        });
      }
    }
    return requests;
  },

  async acceptFriendRequest(requestId: string) {
    const requestRef = doc(db, 'friends', requestId);
    await updateDoc(requestRef, { status: 'accepted' });
  },

  async declineFriendRequest(requestId: string) {
    const requestRef = doc(db, 'friends', requestId);
    await deleteDoc(requestRef);
  },

  async getFriends(userId: string) {
    const friendsRef = collection(db, 'friends');
    const q1 = query(friendsRef, where('requesterId', '==', userId), where('status', '==', 'accepted'));
    const q2 = query(friendsRef, where('receiverId', '==', userId), where('status', '==', 'accepted'));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const allDocs = [...snap1.docs, ...snap2.docs];
    
    const friends: any[] = [];
    for (const docSnap of allDocs) {
      const data = docSnap.data();
      const friendId = data.requesterId === userId ? data.receiverId : data.requesterId;
      
      const friendSnap = await getDoc(doc(db, 'users', friendId));
      if (friendSnap.exists()) {
        friends.push({ 
          ...friendSnap.data(),
          friendshipId: docSnap.id
        });
      }
    }
    return friends;
  },

  async removeFriend(friendshipId: string) {
    const requestRef = doc(db, 'friends', friendshipId);
    await deleteDoc(requestRef);
  },
};
