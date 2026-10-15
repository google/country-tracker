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

import { processLeaderboardDocs } from '@/lib/leaderboardUtils';
import { Country } from '@/data/countries';

describe('processLeaderboardDocs', () => {
  it('should expose uid and real data for the current user', () => {
    const docs = [
      {
        uid: 'user1',
        displayName: 'John',
        visitedCountries: ['AT', 'ED'],
        privacy: { globalLeaderboard: 'anonymous', profileVisibility: 'private' }
      }
    ];
    
    const result = processLeaderboardDocs(docs, 'user1');
    
    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe('user1');
    expect(result[0].displayName).toBe('John');
    expect(result[0].count).toBe(2);
    expect(result[0].isPrivateMode).toBe(true); // Since they are anonymous
  });

  it('should list public users fully visible', () => {
    const docs = [
      {
        uid: 'user2',
        displayName: 'Alice',
        visitedCountries: ['AV'],
        privacy: { globalLeaderboard: 'public', profileVisibility: 'public' }
      }
    ];
    
    const result = processLeaderboardDocs(docs, 'user1');
    expect(result[0].uid).toBe('user2');
    expect(result[0].displayName).toBe('Alice');
    expect(result[0].isPrivateMode).toBe(false);
  });

  it('should hide UID and name for anonymous users', () => {
    const docs = [
      {
        uid: 'user3',
        displayName: 'Bob',
        visitedCountries: ['AT', 'ED'],
        privacy: { globalLeaderboard: 'anonymous', profileVisibility: 'public' }
      }
    ];
    
    const result = processLeaderboardDocs(docs, 'user1');
    expect(result[0].uid).toBeNull();
    expect(result[0].displayName).toBe('Anonymous Explorer');
    expect(result[0].isPrivateMode).toBe(false); // only true for current user
  });

  it('should hide UID if profile is private, even if leaderboard is public', () => {
    const docs = [
      {
        uid: 'user4',
        displayName: 'Charlie',
        visitedCountries: ['AT'],
        privacy: { globalLeaderboard: 'public', profileVisibility: 'private' }
      }
    ];
    
    const result = processLeaderboardDocs(docs, 'user1');
    expect(result[0].uid).toBeNull();
    expect(result[0].displayName).toBe('Charlie'); // Name visible on LB
    expect(result[0].count).toBe(1);
  });

  it('should show info for friends with friends-only settings', () => {
    const docs = [
      {
        uid: 'user5',
        displayName: 'Dave',
        privacy: { globalLeaderboard: 'friends', profileVisibility: 'friends' }
      }
    ];
    
    const friendIds = new Set(['user5']);
    const result = processLeaderboardDocs(docs, 'user1', friendIds);
    expect(result[0].uid).toBe('user5');
    expect(result[0].displayName).toBe('Dave');
  });

  it('should hide info if friends-only but not a friend', () => {
    const docs = [
      {
        uid: 'user5',
        displayName: 'Dave',
        privacy: { globalLeaderboard: 'friends', profileVisibility: 'friends' }
      }
    ];
    
    const friendIds = new Set(['different-user']); // not user5
    const result = processLeaderboardDocs(docs, 'user1', friendIds);
    expect(result[0].uid).toBeNull();
    expect(result[0].displayName).toBe('Anonymous Explorer');
  });

  it('should override privacy settings when provided in map (for groups)', () => {
    const docs = [
      {
        uid: 'user6',
        displayName: 'Eve',
        privacy: { globalLeaderboard: 'anonymous', profileVisibility: 'public' }
      }
    ];
    
    const overrides = new Map([['user6', 'public']]);
    
    const result = processLeaderboardDocs(docs, 'user1', new Set(), overrides);
    expect(result[0].uid).toBe('user6'); // Profile is public, Group is public
    expect(result[0].displayName).toBe('Eve');
  });
  
  it('should sort correctly by visitedCountries count', () => {
    const docs = [
      { uid: 'u1', visitedCountries: ['AT'] }, // 1
      { uid: 'u2', visitedCountries: ['AT', 'ED', 'AV'] }, // 3
      { uid: 'u3', visitedCountries: [] } // 0
    ];
    
    const result = processLeaderboardDocs(docs, 'user1');
    expect(result[0].count).toBe(3);
    expect(result[1].count).toBe(1);
    expect(result[2].count).toBe(0);
  });

  it('should filter out removed country codes from leaderboard counts when activeCountries is configured', () => {
    const activeCountries: Country[] = [
      { name: 'Atlantis', code: 'AT', cca3: 'ATL', ccn3: '001', region: 'Oceanic', capital: 'Poseidonis' },
      { name: 'El Dorado', code: 'ED', cca3: 'ELD', ccn3: '002', region: 'Mythic', capital: 'Manoa' },
    ];

    const docs = [
      { uid: 'u1', displayName: 'User 1', visitedCountries: ['AT', 'REMOVED_1', 'REMOVED_2'] }, // Only 1 active
      { uid: 'u2', displayName: 'User 2', visitedCountries: ['AT', 'ED'] }, // 2 active
    ];

    const result = processLeaderboardDocs(docs, 'u1', new Set(), undefined, false, activeCountries);
    expect(result[0].displayName).toBe('User 2');
    expect(result[0].count).toBe(2);
    expect(result[1].displayName).toBe('User 1');
    expect(result[1].count).toBe(1);
  });
});
