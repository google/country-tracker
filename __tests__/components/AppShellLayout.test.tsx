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
import AppShellLayout from '@/components/AppShellLayout';
import { useAuth } from '@/lib/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

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

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn()
}));

jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/lib/services/registry', () => {
  const mockRepo = {
    getPendingRequests: jest.fn()
  };
  return {
    ServiceRegistry: {
      getFriendsRepository: () => mockRepo
    }
  };
});

import { ServiceRegistry } from '@/lib/services/registry';
const mockFriendsRepository = ServiceRegistry.getFriendsRepository() as any;

const mockPush = jest.fn();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MantineProvider>
      {ui}
    </MantineProvider>
  );
};

describe('AppShellLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockFriendsRepository.getPendingRequests.mockResolvedValue([]);
  });

  it('should render children directly if user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, logOut: jest.fn() });
    
    renderWithProviders(<AppShellLayout><div data-testid="child-content">Unauthenticated content</div></AppShellLayout>);
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByText(/Sign Out/i)).not.toBeInTheDocument();
  });

  it('should render the shell with navigation if user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { uid: 'user123', email: 'test@example.com', displayName: 'Test User' }, 
      logOut: jest.fn() 
    });
    
    renderWithProviders(<AppShellLayout><div data-testid="child-content">Authenticated content</div></AppShellLayout>);
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
  });
});
