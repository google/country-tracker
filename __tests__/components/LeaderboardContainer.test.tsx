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
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import LeaderboardContainer from '@/components/LeaderboardContainer';
import { theme } from '@/theme';
import { fetchSecureLeaderboard } from '@/app/actions/leaderboard';
import { useAuth } from '@/lib/AuthContext';
import { SWRConfig } from 'swr';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: any) => <a>{children}</a>,
}));

jest.mock('@/app/actions/leaderboard', () => ({
  fetchSecureLeaderboard: jest.fn(),
}));

jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
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
      <SWRConfig value={{ provider: () => new Map() }}>
        {ui}
      </SWRConfig>
    </MantineProvider>
  );
};

describe('LeaderboardContainer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'user123' } });
  });

  it('should fetch and display leaderboard entries', async () => {
    const mockEntries = [
      { idKey: 'key_alice', uid: '1', displayName: 'Alice', photoURL: null, count: 10 },
    ];
    (fetchSecureLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

    renderWithMantine(<LeaderboardContainer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/10 Countries/i)).toBeInTheDocument();
    });
  });

  it('should display a loading spinner initially', () => {
    (fetchSecureLeaderboard as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithMantine(<LeaderboardContainer />);
    expect(screen.getByTestId('leaderboard-loader')).toBeInTheDocument();
  });
});
