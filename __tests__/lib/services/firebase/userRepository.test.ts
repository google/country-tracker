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

import { firebaseUserRepository } from '@/lib/services/firebase/userRepository';
import { db } from '@/lib/services/firebase/client';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, collection, getDocs } from 'firebase/firestore';
import { AppUser } from '@/lib/services/interfaces';

// Mock Firebase
jest.mock('@/lib/services/firebase/client', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ type: 'document' })),
  collection: jest.fn(() => ({ type: 'collection' })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  arrayUnion: jest.fn((val) => val),
  arrayRemove: jest.fn((val) => val),
  getFirestore: jest.fn(),
}));

describe('FirebaseUserRepository', () => {
  const userId = 'user123';
  const countryCode = 'AT';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureProfile', () => {
    it('should create a user profile if it does not exist', async () => {
      const mockUser: AppUser = {
        uid: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'http://example.com/photo.jpg',
      };

      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      await firebaseUserRepository.ensureProfile(mockUser);

      expect(doc).toHaveBeenCalledWith(db, 'users', userId);
      expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        uid: userId,
        email: 'test@example.com',
        visitedCountries: [],
      }));
    });

    it('should update the user profile if it already exists without overwriting custom display names', async () => {
      const mockUser: AppUser = { uid: userId, displayName: 'New Name', photoURL: 'new-photo', email: 'test@example.com' };
      (getDoc as jest.Mock).mockResolvedValue({ 
        exists: () => true,
        data: () => ({ displayName: 'Old Custom Name', photoURL: 'old' })
      });

      await firebaseUserRepository.ensureProfile(mockUser);

      expect(setDoc).not.toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { photoURL: 'new-photo' });
    });
  });

  describe('addVisitedCountry', () => {
    it('should add a country to the visitedCountries array', async () => {
      await firebaseUserRepository.addVisitedCountry(userId, countryCode);
      expect(doc).toHaveBeenCalledWith(db, 'users', userId);
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        visitedCountries: arrayUnion(countryCode),
      });
    });
  });

  describe('removeVisitedCountry', () => {
    it('should remove a country from the visitedCountries array', async () => {
      await firebaseUserRepository.removeVisitedCountry(userId, countryCode);
      expect(doc).toHaveBeenCalledWith(db, 'users', userId);
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        visitedCountries: arrayRemove(countryCode),
      });
    });
  });

  describe('getVisitedCountries', () => {
    it('should return the list of visited countries', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ visitedCountries: ['AT', 'ED'] }),
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await firebaseUserRepository.getVisitedCountries(userId);
      expect(result).toEqual(['AT', 'ED']);
    });

    it('should return an empty array if the user document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await firebaseUserRepository.getVisitedCountries(userId);
      expect(result).toEqual([]);
    });
  });

  describe('getLeaderboardData', () => {
    it('should return users sorted by visited countries count', async () => {
      const mockDocs = [
        {
          data: () => ({
            uid: '1',
            displayName: 'User A',
            visitedCountries: ['AT', 'ED'],
            photoURL: 'url1',
          }),
        },
        {
          data: () => ({
            uid: '2',
            displayName: 'User B',
            visitedCountries: ['AV'],
            photoURL: 'url2',
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
      });

      const result = await firebaseUserRepository.getLeaderboardData();

      expect(collection).toHaveBeenCalledWith(db, 'users');
      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe('User A');
      expect(result[0].visitedCountries).toEqual(['AT', 'ED']);
      expect(result[0].count).toBe(2);
      expect(result[1].displayName).toBe('User B');
      expect(result[1].visitedCountries).toEqual(['AV']);
      expect(result[1].count).toBe(1);
    });
  });
});
