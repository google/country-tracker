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

import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { db } from './client';
import { IUserRepository, AppUser, PrivacySettings } from '../interfaces';

/** JSDoc
 * Firebase implementation of the IUserRepository contract.
 */
export const firebaseUserRepository: IUserRepository = {
  async ensureProfile(user: AppUser) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        visitedCountries: [],
        privacy: {
          profileVisibility: 'public',
          globalLeaderboard: 'public',
        },
        createdAt: new Date(),
      });
    } else {
      const updateData: any = {};
      const existing = userSnap.data();
      if (user.displayName && !existing.displayName) {
        updateData.displayName = user.displayName;
      }
      if (user.photoURL && user.photoURL !== existing.photoURL) {
        updateData.photoURL = user.photoURL;
      }
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
      }
    }
  },

  async getProfile(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  },

  async updatePrivacySettings(uid: string, privacy: PrivacySettings) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { privacy });
  },

  async updateUserDisplayName(uid: string, displayName: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { displayName });
  },

  async addVisitedCountry(uid: string, countryCode: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      visitedCountries: arrayUnion(countryCode),
    });
  },

  async removeVisitedCountry(uid: string, countryCode: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      visitedCountries: arrayRemove(countryCode),
    });
  },

  async getVisitedCountries(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().visitedCountries || [];
    }
    return [];
  },

  async getLeaderboardData() {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const leaderboard = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const visitedCountries = data.visitedCountries || [];
      return {
        uid: data.uid,
        displayName: data.displayName || 'Anonymous',
        photoURL: data.photoURL,
        visitedCountries,
        count: visitedCountries.length,
        privacy: data.privacy
      };
    });

    return leaderboard.sort((a, b) => b.count - a.count);
  },
};
