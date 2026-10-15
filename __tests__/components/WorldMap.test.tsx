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
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import WorldMap from '@/components/WorldMap';
import { theme } from '@/theme';

jest.mock('@/data/countries', () => {
  const actual = jest.requireActual('@/data/countries');
  return {
    ...actual,
    countries: [
      { name: 'Atlantis', code: 'AT', cca3: 'ATL', ccn3: '001', region: 'Oceanic', capital: 'Poseidonis' },
      { name: 'El Dorado', code: 'ED', cca3: 'ELD', ccn3: '002', region: 'Mythic', capital: 'Manoa' },
    ],
  };
});

jest.mock('react-simple-maps', () => ({
  ComposableMap: ({ children }: any) => <div data-testid="composable-map">{children}</div>,
  Geographies: ({ children }: any) => {
    const geographies = [{ rsmKey: 'geo-1', id: '001' }, { rsmKey: 'geo-2', id: '002' }];
    return <div data-testid="geographies">{children({ geographies })}</div>;
  },
  Geography: ({ geography }: any) => <div data-testid="geography" data-geo-id={geography.id} />,
  ZoomableGroup: ({ children }: any) => <div data-testid="zoomable-group">{children}</div>,
}));

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const renderWithMantine = (ui: React.ReactElement) => {
  return render(
    <MantineProvider theme={theme}>
      {ui}
    </MantineProvider>
  );
};

describe('WorldMap Component', () => {
  it('should render map components successfully', () => {
    const { getByTestId } = renderWithMantine(<WorldMap visitedCountries={['AT', 'ED']} />);
    
    expect(getByTestId('composable-map')).toBeInTheDocument();
    expect(getByTestId('zoomable-group')).toBeInTheDocument();
    expect(getByTestId('geographies')).toBeInTheDocument();
  });
});
