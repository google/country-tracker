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

import { useEffect } from 'react';

/** JSDoc
 * PWA Service Worker bootstrap utility.
 * Injects the offline mapping script explicitly onto the main thread on mount.
 * Placed in a 'use client' boundary to prevent SSR window reference crashes.
 */
export default function PwaRegistrar() {
  useEffect(() => {
    // Only register the caching layer automatically during active production runs 
    // to intentionally prevent aggressive payload caching during localhost iterations.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA ServiceWorker successfully mounted securely:', registration.scope);
          })
          .catch((error) => {
            console.error('PWA Initialization failure:', error);
          });
      });
    }
  }, []);

  return null;
}
