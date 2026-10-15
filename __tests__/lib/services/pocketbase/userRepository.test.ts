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

import { pocketbaseUserRepository } from '@/lib/services/pocketbase/userRepository';
import PocketBase from 'pocketbase';

// Mock PocketBase
jest.mock('pocketbase', () => jest.fn());

describe('PocketBaseUserRepository', () => {
  let mockPb: any;
  const originalEnv = process.env;
  const userId = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NEXT_PUBLIC_POCKETBASE_URL: 'http://127.0.0.1:8090' };
    
    mockPb = {
      collection: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      getFullList: jest.fn(),
    };
    
    (PocketBase as unknown as jest.Mock).mockImplementation(() => mockPb);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('ensureProfile', () => {
    it('does nothing if profile exists', async () => {
      mockPb.getOne.mockResolvedValue({ id: userId });
      await pocketbaseUserRepository.ensureProfile({ uid: userId, email: 'test@example.com', displayName: 'Test', photoURL: null });
      expect(mockPb.getOne).toHaveBeenCalledWith(userId);
      expect(mockPb.create).not.toHaveBeenCalled();
    });

    it('creates profile if getOne throws 404', async () => {
      mockPb.getOne.mockRejectedValue({ status: 404 });
      await pocketbaseUserRepository.ensureProfile({ uid: userId, email: 'test@example.com', displayName: 'Test', photoURL: null });
      expect(mockPb.create).toHaveBeenCalledWith(expect.objectContaining({ id: userId }));
    });
    
    it('throws error if getOne throws non-404', async () => {
      mockPb.getOne.mockRejectedValue({ status: 500 });
      await expect(pocketbaseUserRepository.ensureProfile({ uid: userId, email: 'test@example.com', displayName: 'Test', photoURL: null }))
        .rejects.toEqual({ status: 500 });
    });
  });

  describe('getProfile', () => {
    it('fetches record by id', async () => {
      mockPb.getOne.mockResolvedValue({ id: userId });
      const res = await pocketbaseUserRepository.getProfile(userId);
      expect(res.id).toBe(userId);
    });
  });

  describe('updatePrivacySettings', () => {
    it('updates record', async () => {
      await pocketbaseUserRepository.updatePrivacySettings(userId, { profileVisibility: 'private', globalLeaderboard: 'anonymous' });
      expect(mockPb.update).toHaveBeenCalledWith(userId, { privacy: { profileVisibility: 'private', globalLeaderboard: 'anonymous' } });
    });
  });

  describe('updateUserDisplayName', () => {
    it('updates display name', async () => {
      await pocketbaseUserRepository.updateUserDisplayName(userId, 'New Name');
      expect(mockPb.update).toHaveBeenCalledWith(userId, { displayName: 'New Name' });
    });
  });

  describe('addVisitedCountry', () => {
    it('appends to list if not present', async () => {
      mockPb.getOne.mockResolvedValue({ visitedCountries: ['AT'] });
      await pocketbaseUserRepository.addVisitedCountry(userId, 'ED');
      expect(mockPb.update).toHaveBeenCalledWith(userId, { visitedCountries: ['AT', 'ED'] });
    });

    it('does not append if already present', async () => {
      mockPb.getOne.mockResolvedValue({ visitedCountries: ['AT'] });
      await pocketbaseUserRepository.addVisitedCountry(userId, 'AT');
      expect(mockPb.update).not.toHaveBeenCalled();
    });
  });

  describe('removeVisitedCountry', () => {
    it('removes from list', async () => {
      mockPb.getOne.mockResolvedValue({ visitedCountries: ['AT', 'ED'] });
      await pocketbaseUserRepository.removeVisitedCountry(userId, 'AT');
      expect(mockPb.update).toHaveBeenCalledWith(userId, { visitedCountries: ['ED'] });
    });
  });

  describe('getVisitedCountries', () => {
    it('returns list', async () => {
      mockPb.getOne.mockResolvedValue({ visitedCountries: ['AT'] });
      const res = await pocketbaseUserRepository.getVisitedCountries(userId);
      expect(res).toEqual(['AT']);
    });
  });

  describe('getLeaderboardData', () => {
    it('fetches and sorts data', async () => {
      mockPb.getFullList.mockResolvedValue([
        { id: 'u1', visitedCountries: ['AT'], privacy: { globalLeaderboard: 'public' } },
        { id: 'u2', visitedCountries: ['AT', 'ED'], privacy: { globalLeaderboard: 'public' } },
        { id: 'u3', visitedCountries: [], privacy: { globalLeaderboard: 'anonymous' }, displayName: 'Secret' },
      ]);

      const data = await pocketbaseUserRepository.getLeaderboardData();
      expect(data).toHaveLength(3);
      expect(data[0].uid).toBe('u2'); // Highest count first
      expect(data[2].displayName).toBe('Anonymous'); // Masked
    });
  });
});
