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

import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

/** JSDoc
 * Defines the core design system primitives used by Mantine context across the app.
 * Configures the strict primary and secondary color palettes alongside structural overrides.
 */
const digitalAtlasBlue: MantineColorsTuple = [
  "#eef3ff",
  "#dce4f5",
  "#b9c7e2",
  "#94a8d0",
  "#748dc1",
  "#5f7cb8",
  "#5173b4",
  "#41629f",
  "#32558e",
  "#1b497e"
];

const digitalAtlasCyan: MantineColorsTuple = [
  "#e0feff",
  "#cefaff",
  "#a1f5fa",
  "#70f0f7",
  "#4cecf4",
  "#35eaf3",
  "#28e9f3",
  "#18cee8",
  "#00b6cf",
  "#009eb5"
];

/** JSDoc
 * The default exported application theme object consumed by MantineProvider at the root layout.
 * Enforces uniform radiuses, standardized typography, and overrides baseline component CSS.
 */
export const theme = createTheme({
  colors: {
    'digital-atlas-blue': digitalAtlasBlue,
    'digital-atlas-cyan': digitalAtlasCyan,
  },
  primaryColor: 'digital-atlas-cyan',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'md',
        fw: 600,
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
        shadow: 'sm',
      },
      styles: {
        root: {
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
        }
      }
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
          transition: 'background-color 0.3s ease',
        }
      }
    }
  },
});
