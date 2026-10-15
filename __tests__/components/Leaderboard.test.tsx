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
import Leaderboard from '@/components/Leaderboard';
import { theme } from '@/theme';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: any) => <a>{children}</a>,
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

const renderWithMantine = (ui: React.ReactElement) => {
  return render(
    <MantineProvider theme={theme}>
      {ui}
    </MantineProvider>
  );
};

describe('Leaderboard Component', () => {
  const mockEntries = [
    {
      idKey: 'key_1',
      uid: '1',
      displayName: 'User A',
      photoURL: 'url1',
      count: 10,
    },
    {
      idKey: 'key_2',
      uid: '2',
      displayName: 'User B',
      photoURL: null,
      count: 5,
    },
  ];

  it('should render leaderboard entries correctly', () => {
    renderWithMantine(<Leaderboard entries={mockEntries} />);
    
    expect(screen.getByText(/User A/i)).toBeInTheDocument();
    expect(screen.getByText(/10 Countries/i)).toBeInTheDocument();
    expect(screen.getByText(/User B/i)).toBeInTheDocument();
    expect(screen.getByText(/5 Countries/i)).toBeInTheDocument();
  });

  it('should display a fallback message when there are no entries', () => {
    renderWithMantine(<Leaderboard entries={[]} />);
    expect(screen.getByText(/No users found/i)).toBeInTheDocument();
  });
});
