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
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import VisitedCountriesSummary from '@/components/VisitedCountriesSummary';
import { theme } from '@/theme';

jest.mock('@/data/countries', () => {
  const actual = jest.requireActual('@/data/countries');
  return {
    ...actual,
    countries: [
      { code: 'AT', name: 'Atlantis', flag: '🔱' },
      { code: 'ED', name: 'El Dorado' },
      { code: 'AV', name: 'Avalon' },
    ],
  };
});

const renderWithMantine = (ui: React.ReactElement) => {
  return render(
    <MantineProvider theme={theme}>
      {ui}
    </MantineProvider>
  );
};

describe('VisitedCountriesSummary Component', () => {
  it('should display the correct number of visited countries relative to total', () => {
    renderWithMantine(<VisitedCountriesSummary visitedCountries={['AT', 'ED', 'AV']} />);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should handle zero visited countries', () => {
    renderWithMantine(<VisitedCountriesSummary visitedCountries={[]} />);
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
  });

  it('should render the flags of visited countries including custom flag overrides', () => {
    renderWithMantine(<VisitedCountriesSummary visitedCountries={['AT', 'ED']} />);
    expect(screen.getByText('🔱')).toBeInTheDocument();
    expect(screen.getByText('🇪🇩')).toBeInTheDocument();
  });

  it('should ignore removed country codes that are no longer in the active country list', () => {
    renderWithMantine(<VisitedCountriesSummary visitedCountries={['AT', 'REMOVED_CODE']} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText(/33\.3%/)).toBeInTheDocument();
  });
});
