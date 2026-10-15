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
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import CountryList from '@/components/CountryList';
import { theme } from '@/theme';
import * as countriesModule from '@/data/countries';

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
        flag: '🔱',
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

const renderWithMantine = (ui: React.ReactElement) => {
  return render(
    <MantineProvider theme={theme}>
      {ui}
    </MantineProvider>
  );
};

describe('CountryList Component', () => {
  it('should render a list of configured countries', () => {
    renderWithMantine(<CountryList visitedCountries={[]} onToggleCountry={() => {}} />);
    expect(screen.getByText(/Atlantis/i)).toBeInTheDocument();
    expect(screen.getByText(/El Dorado/i)).toBeInTheDocument();
    expect(screen.getByText('🔱')).toBeInTheDocument();
  });

  it('should show which countries are visited', () => {
    renderWithMantine(<CountryList visitedCountries={['AT']} onToggleCountry={() => {}} />);
    const atlantisCard = screen.getByText(/Atlantis/i).closest('.mantine-Card-root');
    const atlantisCheckbox = atlantisCard?.querySelector('input[type="checkbox"]');
    expect(atlantisCheckbox).toBeChecked();

    const elDoradoCard = screen.getByText(/El Dorado/i).closest('.mantine-Card-root');
    const elDoradoCheckbox = elDoradoCard?.querySelector('input[type="checkbox"]');
    expect(elDoradoCheckbox).not.toBeChecked();
  });

  it('should call onToggleCountry when a country card is clicked', () => {
    const onToggleCountry = jest.fn();
    renderWithMantine(<CountryList visitedCountries={[]} onToggleCountry={onToggleCountry} />);

    const atlantisText = screen.getByText(/Atlantis/i);
    fireEvent.click(atlantisText);

    expect(onToggleCountry).toHaveBeenCalledWith('AT');
  });

  it('should display a setup notice when no countries are configured', () => {
    const backup = [...countriesModule.countries];
    countriesModule.countries.splice(0, countriesModule.countries.length);

    try {
      renderWithMantine(<CountryList visitedCountries={[]} onToggleCountry={() => {}} />);
      expect(screen.getByText(/No Country List Configured/i)).toBeInTheDocument();
      expect(screen.getByText(/config\/countries\.json/i)).toBeInTheDocument();
    } finally {
      countriesModule.countries.push(...backup);
    }
  });
});
