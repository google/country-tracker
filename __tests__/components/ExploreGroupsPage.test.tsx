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
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { MantineProvider } from '@mantine/core';

jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn((key) => {
    if (typeof key === 'string' && key.startsWith('user-groups-')) {
      return { data: [] }; // Default empty
    }
    return { data: undefined };
  })
}));

jest.mock('@/lib/services/registry', () => {
  const mockRepo = {
    searchPublicGroups: jest.fn(),
    joinPublicGroup: jest.fn(),
    getUserGroups: jest.fn(() => Promise.resolve([])),
  };
  return {
    ServiceRegistry: {
      getGroupRepository: () => mockRepo,
    },
  };
});

import ExploreGroupsPage from '@/app/groups/explore/page';
import { ServiceRegistry } from '@/lib/services/registry';
const mockGroupRepository = ServiceRegistry.getGroupRepository() as any;
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('ExploreGroupsPage Component', () => {
  const mockUser = { uid: 'user123', email: 'test@example.com' };
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
  });

  it('renders correctly and searches automatically on load', async () => {
    (mockGroupRepository.searchPublicGroups as jest.Mock).mockResolvedValue({
      groups: [
        { id: 'group1', name: 'Euro Trip', description: 'Fun trip', memberCount: 5, visibility: 'public' }
      ],
      nextCursor: null
    });

    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });
    
    expect(screen.getByText('Explore Public Groups')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockGroupRepository.searchPublicGroups).toHaveBeenCalledWith('', 10, null);
      expect(screen.getByText('Euro Trip')).toBeInTheDocument();
    });
  });

  it('allows user to join a group and navigates on success', async () => {
    (mockGroupRepository.searchPublicGroups as jest.Mock).mockResolvedValue({
      groups: [{ id: 'group2', name: 'Asia Adventure', memberCount: 1, visibility: 'public' }],
      nextCursor: null
    });

    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Asia Adventure')).toBeInTheDocument();
    });

    const joinBtns = screen.getAllByRole('button', { name: /Join/i });
    expect(joinBtns.length).toBeGreaterThan(0);
    
    (mockGroupRepository.joinPublicGroup as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(joinBtns[0]);
    });

    expect(mockGroupRepository.joinPublicGroup).toHaveBeenCalledWith('group2', 'user123');
    expect(mockRouterPush).toHaveBeenCalledWith('/groups/group2');
  });

  it('debounces user search input', async () => {
    (mockGroupRepository.searchPublicGroups as jest.Mock).mockResolvedValue({ groups: [], nextCursor: null });

    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });

    const searchInput = screen.getByPlaceholderText(/Search public groups by name.../i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Japan' } });
    });

    await waitFor(() => {
      expect(mockGroupRepository.searchPublicGroups).toHaveBeenCalledWith('Japan', 10, null);
    }, { timeout: 1000 });
  });

  it('navigates back to my groups on button click', async () => {
    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });

    const backBtn = screen.getByRole('button', { name: /Back to My Groups/i });
    fireEvent.click(backBtn);
    expect(mockRouterPush).toHaveBeenCalledWith('/groups');
  });

  it('navigates to group page when clicking View Group', async () => {
    const useSWR = require('swr').default;
    (useSWR as jest.Mock).mockReturnValue({ data: [{ id: 'group1', name: 'My Group' }] });
    
    (mockGroupRepository.searchPublicGroups as jest.Mock).mockResolvedValue({
      groups: [{ id: 'group1', name: 'My Group', visibility: 'public' }],
      nextCursor: null
    });

    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View Group/i })).toBeInTheDocument();
    });

    const viewBtn = screen.getByRole('button', { name: /View Group/i });
    fireEvent.click(viewBtn);
    expect(mockRouterPush).toHaveBeenCalledWith('/groups/group1');
  });

  it('shows alert on join failure', async () => {
    (mockGroupRepository.searchPublicGroups as jest.Mock).mockResolvedValue({
      groups: [{ id: 'group2', name: 'Asia Adventure', memberCount: 1, visibility: 'public' }],
      nextCursor: null
    });

    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Asia Adventure')).toBeInTheDocument();
    });

    const joinBtns = screen.getAllByRole('button', { name: /Join/i });
    
    (mockGroupRepository.joinPublicGroup as jest.Mock).mockRejectedValue(new Error('Fail'));
    window.alert = jest.fn();

    await act(async () => {
      fireEvent.click(joinBtns[0]);
    });

    expect(window.alert).toHaveBeenCalledWith('Failed to join group');
  });

  it('allows user to load more groups', async () => {
    (mockGroupRepository.searchPublicGroups as jest.Mock)
      .mockResolvedValueOnce({
        groups: [{ id: 'group1', name: 'Group 1', visibility: 'public' }],
        nextCursor: { id: 'cursor1' }
      })
      .mockResolvedValueOnce({
        groups: [{ id: 'group2', name: 'Group 2', visibility: 'public' }],
        nextCursor: null
      });

    await act(async () => {
      renderWithMantine(<ExploreGroupsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Group 1')).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole('button', { name: /Load More/i });
    expect(loadMoreBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Group 2')).toBeInTheDocument();
    });
  });
});
