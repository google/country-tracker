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

import { IAuthService, AppUser, AuthCredentials } from '../interfaces';
import { getPb } from './client';

/** JSDoc
 * Maps a PocketBase Auth model to the application-specific AppUser interface.
 */
const mapPocketBaseUser = (model: any): AppUser => ({
  uid: model.id,
  email: model.email || null,
  displayName: model.displayName || model.name || model.username || model.email || 'User',
  photoURL: model.avatarUrl || model.avatar || null,
});

/** JSDoc
 * PocketBase implementation of the IAuthService contract using native email/password authentication.
 */
export const pocketbaseAuthService: IAuthService = {
  async signIn(credentials?: AuthCredentials) {
    const pb = getPb();
    const email = credentials?.email || 'demo@example.com';
    const password = credentials?.password || 'password123456';

    try {
      await pb.collection('users').authWithPassword(email, password);
    } catch (err: any) {
      // If user doesn't exist yet in PocketBase, attempt auto-creation for seamless demo setup
      if (err?.status === 400 || err?.status === 404) {
        try {
          await pb.collection('users').create({
            email,
            password,
            passwordConfirm: password,
            name: email.split('@')[0],
          });
          await pb.collection('users').authWithPassword(email, password);
          return;
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },

  async signOut() {
    const pb = getPb();
    pb.authStore.clear();
  },

  onAuthStateChange(callback) {
    const pb = getPb();
    // Register the listener and return the unsubscribe function natively.
    const unsubscribe = pb.authStore.onChange((token, model) => {
      callback(model ? mapPocketBaseUser(model) : null);
    }, true); // fireImmediately = true to get initial state
    
    return unsubscribe;
  },
};
