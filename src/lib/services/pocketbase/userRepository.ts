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

import { IUserRepository, AppUser, PrivacySettings } from '../interfaces';
import { getPb } from './client';

/** JSDoc
 * PocketBase implementation of the IUserRepository contract.
 */
export const pocketbaseUserRepository: IUserRepository = {
  async ensureProfile(user: AppUser) {
    const pb = getPb();
    try {
      await pb.collection('users').getOne(user.uid);
    } catch (err: any) {
      // 404 indicates the document profile does not exist yet. Create shadow stub.
      if (err.status === 404) {
        await pb.collection('users').create({
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          visitedCountries: [],
          privacy: { profileVisibility: 'public', globalLeaderboard: 'public' }
        });
      } else {
        throw err;
      }
    }
  },

  async getProfile(uid: string) {
    const pb = getPb();
    return await pb.collection('users').getOne(uid);
  },

  async updatePrivacySettings(uid: string, settings: PrivacySettings) {
    const pb = getPb();
    await pb.collection('users').update(uid, { privacy: settings });
  },

  async updateUserDisplayName(uid: string, displayName: string) {
    const pb = getPb();
    await pb.collection('users').update(uid, { displayName });
  },

  async addVisitedCountry(uid: string, countryCode: string) {
    const pb = getPb();
    const user = await pb.collection('users').getOne(uid);
    const visited = user.visitedCountries || [];
    if (!visited.includes(countryCode)) {
      await pb.collection('users').update(uid, {
        visitedCountries: [...visited, countryCode]
      });
    }
  },

  async removeVisitedCountry(uid: string, countryCode: string) {
    const pb = getPb();
    const user = await pb.collection('users').getOne(uid);
    const visited = user.visitedCountries || [];
    await pb.collection('users').update(uid, {
      visitedCountries: visited.filter((c: string) => c !== countryCode)
    });
  },

  async getVisitedCountries(uid: string) {
    const pb = getPb();
    const user = await pb.collection('users').getOne(uid);
    return user.visitedCountries || [];
  },

  async getLeaderboardData() {
    const pb = getPb();
    
    // Fetch all profiles that have not requested explicit private boundaries.
    const records = await pb.collection('users').getFullList({
      filter: 'privacy.globalLeaderboard != "private"',
    });
    
    // Sort in memory by array length factoring in privacy masking natively.
    return records.map(r => ({
      uid: r.id,
      displayName: r.privacy?.globalLeaderboard === 'anonymous' ? 'Anonymous' : r.displayName || 'Anonymous',
      photoURL: r.privacy?.globalLeaderboard === 'anonymous' ? null : r.photoURL,
      visitedCountries: r.visitedCountries || [],
      privacy: r.privacy
    })).sort((a, b) => b.visitedCountries.length - a.visitedCountries.length);
  },
};
