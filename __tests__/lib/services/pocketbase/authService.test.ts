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

process.env.NEXT_PUBLIC_POCKETBASE_URL = 'http://127.0.0.1:8090';
import { pocketbaseAuthService } from '@/lib/services/pocketbase/authService';
import PocketBase from 'pocketbase';

// Mock PocketBase
jest.mock('pocketbase', () => jest.fn());

describe('PocketBaseAuthService', () => {
  let mockPb: any;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Simulate environment variable being present
    process.env.NEXT_PUBLIC_POCKETBASE_URL = 'http://127.0.0.1:8090';
    
    mockPb = {
      collection: jest.fn().mockReturnThis(),
      authWithPassword: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      authStore: {
        clear: jest.fn(),
        onChange: jest.fn(),
      },
    };
    
    (PocketBase as unknown as jest.Mock).mockImplementation(() => mockPb);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
  });

  describe('signIn', () => {
    it('should call authWithPassword with credentials', async () => {
      await pocketbaseAuthService.signIn({ email: 'user@test.com', password: 'secretpassword' });
      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockPb.authWithPassword).toHaveBeenCalledWith('user@test.com', 'secretpassword');
    });

    it('should fallback to default credentials when none provided', async () => {
      await pocketbaseAuthService.signIn();
      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockPb.authWithPassword).toHaveBeenCalledWith('demo@example.com', 'password123456');
    });
  });

  describe('signOut', () => {
    it('should call authStore.clear', async () => {
      await pocketbaseAuthService.signOut();
      expect(mockPb.authStore.clear).toHaveBeenCalled();
    });
  });

  describe('onAuthStateChange', () => {
    it('should call authStore.onChange and map user correctly', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockPb.authStore.onChange.mockReturnValue(mockUnsubscribe);

      const unsubscribe = pocketbaseAuthService.onAuthStateChange(mockCallback);

      expect(mockPb.authStore.onChange).toHaveBeenCalledWith(expect.any(Function), true);
      expect(unsubscribe).toBe(mockUnsubscribe);

      // Simulate auth state change
      const authStoreChangeCallback = mockPb.authStore.onChange.mock.calls[0][0];
      
      const mockModel = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      authStoreChangeCallback('token', mockModel);
      
      expect(mockCallback).toHaveBeenCalledWith({
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      });
    });

    it('should pass null if model is null', () => {
      const mockCallback = jest.fn();
      pocketbaseAuthService.onAuthStateChange(mockCallback);

      const authStoreChangeCallback = mockPb.authStore.onChange.mock.calls[0][0];
      authStoreChangeCallback('token', null);
      
      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('Initialization', () => {
    it('should throw error if NEXT_PUBLIC_POCKETBASE_URL is missing in non-test env', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_POCKETBASE_URL = '';
      
      await expect(pocketbaseAuthService.signIn()).rejects.toThrow("NEXT_PUBLIC_POCKETBASE_URL is not defined");
      
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});
