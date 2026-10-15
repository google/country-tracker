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
import StyleGuide from '@/components/StyleGuide';
import { theme } from '@/theme';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(
    <MantineProvider theme={theme}>
      {ui}
    </MantineProvider>
  );
};

describe('StyleGuide Component', () => {
  it('renders the Style Guide title', () => {
    renderWithMantine(<StyleGuide />);
    expect(screen.getByRole('heading', { level: 1, name: /Style Guide/i })).toBeInTheDocument();
  });

  it('renders typography sections', () => {
    renderWithMantine(<StyleGuide />);
    expect(screen.getByRole('heading', { level: 2, name: /Typography/i })).toBeInTheDocument();
  });

  it('renders buttons section', () => {
    renderWithMantine(<StyleGuide />);
    expect(screen.getByRole('heading', { level: 2, name: /Buttons/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Default/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Destructive/i })).toBeInTheDocument();
  });
});
