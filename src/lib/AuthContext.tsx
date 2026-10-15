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

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, AuthCredentials } from './services/interfaces';
import { ServiceRegistry } from './services/registry';

const authService = ServiceRegistry.getAuthService();
const userRepository = ServiceRegistry.getUserRepository();
import { useRouter, usePathname } from 'next/navigation';
import { Loader, Center } from '@mantine/core';

/** JSDoc
 * Defines the contract for the global authentication state.
 * Exposes loading/session variables and backend authentication controls.
 */
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (credentials?: AuthCredentials) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/** JSDoc
 * Central React Context Provider responsible for bootstrapping Authentication.
 * Handles establishing the persistent session listener and executing route protection redirects.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await userRepository.ensureProfile(currentUser);
        } catch (error) {
          console.error('Error ensuring profile:', error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Soft client-side router protection enforcement. 
  // Forces unauthorized actors back to /login on secured routes while excluding public exception routes like /profile/.
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login' && !pathname.startsWith('/profile/')) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  /** JSDoc
   * Wraps the native authentication handler for the configured backend.
   * Auto-redirects to dashboard upon successful token generation.
   */
  const signIn = async (credentials?: AuthCredentials) => {
    try {
      await authService.signIn(credentials);
      router.push('/');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await authService.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {loading ? (
        <Center style={{ minHeight: '100vh' }}>
          <Loader size="xl" />
        </Center>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
