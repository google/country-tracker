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

import { firebaseAuthService } from '@/lib/services/firebase/authService';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/services/firebase/client';

jest.mock('@/lib/services/firebase/client', () => ({
  auth: { type: 'auth' },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should call signInWithPopup with auth and provider', async () => {
      const mockProvider = { type: 'provider' };
      (GoogleAuthProvider as unknown as jest.Mock).mockImplementation(() => mockProvider);
      
      await firebaseAuthService.signIn();
      
      expect(signInWithPopup).toHaveBeenCalledWith({ type: 'auth' }, mockProvider);
    });
  });

  describe('signOut', () => {
    it('should call signOut with auth', async () => {
      await firebaseAuthService.signOut();
      expect(signOut).toHaveBeenCalledWith({ type: 'auth' });
    });
  });

  describe('onAuthStateChange', () => {
    it('should call onAuthStateChanged and map user correctly', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = firebaseAuthService.onAuthStateChange(mockCallback);

      expect(onAuthStateChanged).toHaveBeenCalledWith({ type: 'auth' }, expect.any(Function));
      expect(unsubscribe).toBe(mockUnsubscribe);

      // Simulate auth state change
      const authStateChangeCallback = (onAuthStateChanged as jest.Mock).mock.calls[0][1];
      
      const mockFirebaseUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'http://example.com/photo.jpg',
      };
      
      authStateChangeCallback(mockFirebaseUser);
      
      expect(mockCallback).toHaveBeenCalledWith({
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'http://example.com/photo.jpg',
      });
    });

    it('should pass null to callback if user is null', () => {
      const mockCallback = jest.fn();
      const unsubscribe = firebaseAuthService.onAuthStateChange(mockCallback);

      const authStateChangeCallback = (onAuthStateChanged as jest.Mock).mock.calls[0][1];
      authStateChangeCallback(null);
      
      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });
});
