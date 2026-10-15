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

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/** JSDoc
 * Validates and caches the core Firebase configuration derived from ENV variables.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    if (getApps().length === 0) {
      _app = initializeApp(firebaseConfig);
    } else {
      _app = getApp();
    }
  }
  return _app;
}

// Export lazy proxies for client references so Firebase is only initialized when actually accessed
const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    if (!_auth) {
      _auth = getAuth(getFirebaseApp());
    }
    const val = Reflect.get(_auth, prop, receiver);
    return typeof val === 'function' ? val.bind(_auth) : val;
  },
});

const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = getFirestore(getFirebaseApp());
    }
    const val = Reflect.get(_db, prop, receiver);
    return typeof val === 'function' ? val.bind(_db) : val;
  },
});

const app: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_target, prop, receiver) {
    const instance = getFirebaseApp();
    const val = Reflect.get(instance, prop, receiver);
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export { app, auth, db };
