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

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme';
import { SWRConfig } from 'swr';

jest.mock('@/data/countries', () => {
  const actual = jest.requireActual('@/data/countries');
  return {
    ...actual,
    countries: [
      {
        name: 'Atlantis',
        code: 'AT',
        cca3: 'ATL',
        ccn3: '001',
        region: 'Oceanic',
        capital: 'Poseidonis',
      },
      {
        name: 'El Dorado',
        code: 'ED',
        cca3: 'ELD',
        ccn3: '002',
        region: 'Mythic',
        capital: 'Manoa',
      },
    ],
  };
});

jest.mock('react-simple-maps', () => ({
  ComposableMap: () => <div data-testid="composable-map" />,
  Geographies: () => <div data-testid="geographies" />,
  Geography: () => <div data-testid="geography" />,
  ZoomableGroup: () => <div data-testid="zoomable-group" />,
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

jest.mock('@/lib/services/registry', () => {
  const mockRepo = {
    getVisitedCountries: jest.fn(),
    addVisitedCountry: jest.fn(),
    removeVisitedCountry: jest.fn(),
  };
  return {
    ServiceRegistry: {
      getUserRepository: () => mockRepo,
    },
  };
});

import CountryTracker from '@/components/CountryTracker';
import { ServiceRegistry } from '@/lib/services/registry';

const mockGetUserRepository = ServiceRegistry.getUserRepository() as any;

// Mock VisitedCountriesSummary
jest.mock('@/components/VisitedCountriesSummary', () => {
  return function MockVisitedCountriesSummary({ visitedCountries }: { visitedCountries: string[] }) {
    return <div data-testid="visited-summary">Visited: {visitedCountries.length}</div>;
  };
});

const renderWithMantine = (ui: React.ReactElement) => {
  return render(
    <MantineProvider theme={theme}>
      <SWRConfig value={{ provider: () => new Map() }}>
        {ui}
      </SWRConfig>
    </MantineProvider>
  );
};

describe('CountryTracker Component', () => {
  const userId = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display visited countries', async () => {
    mockGetUserRepository.getVisitedCountries.mockResolvedValue(['AT']);
    renderWithMantine(<CountryTracker userId={userId} />);
    
    await waitFor(() => {
      const atlantisCard = screen.getByText(/Atlantis/i).closest('.mantine-Card-root');
      const atlantisCb = atlantisCard?.querySelector('input[type="checkbox"]');
      expect(atlantisCb).toBeChecked();

      const elDoradoCard = screen.getByText(/El Dorado/i).closest('.mantine-Card-root');
      const elDoradoCb = elDoradoCard?.querySelector('input[type="checkbox"]');
      expect(elDoradoCb).not.toBeChecked();
    }, { timeout: 3000 });
  });

  it('should call addVisitedCountry when a country is selected', async () => {
    mockGetUserRepository.getVisitedCountries.mockResolvedValue([]);
    renderWithMantine(<CountryTracker userId={userId} />);
    
    await waitFor(() => {
       expect(screen.getByText(/El Dorado/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const text = screen.getByText(/El Dorado/i);
    fireEvent.click(text);
    
    await waitFor(() => {
      expect(mockGetUserRepository.addVisitedCountry).toHaveBeenCalledWith(userId, 'ED');
    });
  });

  it('should call removeVisitedCountry when a country is deselected', async () => {
    mockGetUserRepository.getVisitedCountries.mockResolvedValue(['AT']);
    renderWithMantine(<CountryTracker userId={userId} />);
    
    await waitFor(() => {
       expect(screen.getByText(/Atlantis/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const text = screen.getByText(/Atlantis/i);
    fireEvent.click(text);
    
    await waitFor(() => {
      expect(mockGetUserRepository.removeVisitedCountry).toHaveBeenCalledWith(userId, 'AT');
    });
  });
});
