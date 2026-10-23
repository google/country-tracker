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

/**
 * Design System — "Sunlit Passport & Vintage Air Mail" (Option 1)
 *
 * Architectural Rationale:
 * Replaces generic dark/cyan SaaS styling with a bright, tactile travel logbook aesthetic
 * inspired by classic clothbound passports, vintage Par Avion airmail envelopes, and
 * sunlit mid-century travel posters:
 * 1. Surface Palette: Warm parchment canvas (`#FAF6EE`) and crisp ivory cards (`#FFFDF9`)
 *    with warm sand borders (`#DFD5C0`) in light mode, paired with deep midnight passport
 *    leather (`#0F172A` / `#16213A`) in dark mode via CSS `light-dark()`.
 * 2. Editorial Typography: Expressive classic serif headings (`Georgia, serif`) paired
 *    with clean humanist sans-serif UI copy (`Inter`) and monospace ISO-3166 `cca3` codes.
 * 3. Continent Color-Coding: Centralized `getRegionAccent` helper maps each continent
 *    (`Asia`, `Europe`, `Americas`, `Africa`, `Oceania`) to a distinct, harmonious ink
 *    palette used consistently across the WorldMap, CountryList stamps, and summary pills.
 */

'use client';

import { createTheme, MantineColorsTuple } from '@mantine/core';

/** JSDoc
 * Defines the core design system primitives used by Mantine context across the app.
 * Configures the strict primary and secondary color palettes alongside structural overrides.
 *
 * `passportNavy` serves as the primary Pan Am / Passport Navy ink tuple (`#1D3557` anchor),
 * mapped to both `passport-navy` and legacy `digital-atlas-cyan` / `digital-atlas-blue` keys
 * so existing component color props automatically inherit the Sunlit Passport palette.
 */
const passportNavy: MantineColorsTuple = [
  "#f0f4f9",
  "#dce5f0",
  "#b8cbe2",
  "#90aed3",
  "#6c94c5",
  "#4976b0",
  "#1d3557",
  "#172b47",
  "#112036",
  "#0b1526"
];

const postmarkRed: MantineColorsTuple = [
  "#fdedee",
  "#f9d6d8",
  "#f2abaf",
  "#ec7d84",
  "#e8565f",
  "#e63946",
  "#d42c39",
  "#b4222e",
  "#931b25",
  "#75141d"
];

const botanicalTeal: MantineColorsTuple = [
  "#eaf7f5",
  "#d2edea",
  "#a6dbd5",
  "#75c8be",
  "#4db8ab",
  "#34ae9f",
  "#2a9d8f",
  "#208276",
  "#17685e",
  "#0e4e46"
];

const sunlitMarigold: MantineColorsTuple = [
  "#fef6ec",
  "#fce8d0",
  "#f9cfa0",
  "#f6b56d",
  "#f4a261",
  "#ee8b3d",
  "#df7322",
  "#bc5b16",
  "#974712",
  "#78370d"
];

export interface RegionAccent {
  name: string;
  hex: string;
  hoverHex: string;
  bgLight: string;
  borderLight: string;
  textLight: string;
}

/**
 * Continent color-coding palette used across WorldMap geographies, CountryList visited cards,
 * passport ink stamps, and VisitedCountriesSummary regional breakdowns.
 */
export const CONTINENT_PALETTE: Record<string, RegionAccent> = {
  Asia: {
    name: 'Asia',
    hex: '#D95D39',
    hoverHex: '#E67655',
    bgLight: '#FDF2EE',
    borderLight: '#F2C5B6',
    textLight: '#9C3618',
  },
  Europe: {
    name: 'Europe',
    hex: '#1E6091',
    hoverHex: '#2B79B3',
    bgLight: '#EDF4F9',
    borderLight: '#B6D2E7',
    textLight: '#154468',
  },
  Americas: {
    name: 'Americas',
    hex: '#2A7F62',
    hoverHex: '#389E7B',
    bgLight: '#EDF7F3',
    borderLight: '#B4DFCF',
    textLight: '#1B5943',
  },
  Africa: {
    name: 'Africa',
    hex: '#C88A2B',
    hoverHex: '#DDA144',
    bgLight: '#FBF5EA',
    borderLight: '#E8D0A5',
    textLight: '#8A5B13',
  },
  Oceania: {
    name: 'Oceania',
    hex: '#008B8B',
    hoverHex: '#17A5A5',
    bgLight: '#EBF7F7',
    borderLight: '#AEE0E0',
    textLight: '#005F5F',
  },
};

const DEFAULT_REGION_ACCENT: RegionAccent = {
  name: 'World',
  hex: '#E63946',
  hoverHex: '#F05662',
  bgLight: '#FDEDEE',
  borderLight: '#F5BDC1',
  textLight: '#A8202C',
};

/**
 * Resolves the continent accent palette for a given country region string.
 * Gracefully falls back to the Postmark Vermilion accent for custom or synthetic regions.
 */
export const getRegionAccent = (region = ''): RegionAccent =>
  CONTINENT_PALETTE[region] || DEFAULT_REGION_ACCENT;

/** JSDoc
 * The default exported application theme object consumed by MantineProvider at the root layout.
 * Enforces uniform radiuses, standardized typography, and overrides baseline component CSS.
 */
export const theme = createTheme({
  colors: {
    'passport-navy': passportNavy,
    'postmark-red': postmarkRed,
    'botanical-teal': botanicalTeal,
    'sunlit-marigold': sunlitMarigold,
    'digital-atlas-blue': passportNavy,
    'digital-atlas-cyan': passportNavy,
  },
  primaryColor: 'digital-atlas-cyan',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  headings: {
    fontFamily: 'Georgia, "Times New Roman", serif',
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
          backgroundColor: 'light-dark(#FFFDF9, #16213A)',
          borderColor: 'light-dark(#DFD5C0, #2A3B5C)',
        }
      }
    },
    Paper: {
      styles: {
        root: {
          backgroundColor: 'light-dark(#FFFDF9, #16213A)',
          borderColor: 'light-dark(#DFD5C0, #2A3B5C)',
        }
      }
    },
    AppShell: {
      styles: {
        header: {
          backgroundColor: 'light-dark(#FFFDF9, #131D33)',
          borderColor: 'light-dark(#DFD5C0, #2A3B5C)',
        },
        navbar: {
          backgroundColor: 'light-dark(#F5EFE2, #131D33)',
          borderColor: 'light-dark(#DFD5C0, #2A3B5C)',
        },
        main: {
          backgroundColor: 'light-dark(#FAF6EE, #0F172A)',
          transition: 'background-color 0.3s ease',
        }
      }
    }
  },
});
