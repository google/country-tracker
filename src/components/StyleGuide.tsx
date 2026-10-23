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

import { Button } from '@mantine/core';

/** JSDoc
 * Local development utility displaying an ad-hoc taxonomy of standardized style tokens.
 * Assists in isolating UI primitives for rapid visual regression testing manually.
 */
const StyleGuide = () => {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-4xl font-bold mb-4">Style Guide</h1>

      {/* Colors Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="w-full h-24 rounded-lg border mb-2" style={{ backgroundColor: '#1D3557' }}></div>
            <p className="text-center font-medium">Passport Navy (#1D3557)</p>
          </div>
          <div>
            <div className="w-full h-24 rounded-lg border mb-2" style={{ backgroundColor: '#E63946' }}></div>
            <p className="text-center font-medium">Postmark Vermilion (#E63946)</p>
          </div>
          <div>
            <div className="w-full h-24 rounded-lg border mb-2" style={{ backgroundColor: '#2A9D8F' }}></div>
            <p className="text-center font-medium">Botanical Teal (#2A9D8F)</p>
          </div>
          <div>
            <div className="w-full h-24 rounded-lg border mb-2" style={{ backgroundColor: '#F4A261' }}></div>
            <p className="text-center font-medium">Sunlit Marigold (#F4A261)</p>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Typography</h2>
        <h1 className="text-4xl font-bold">Heading 1</h1>
        <h2 className="text-3xl font-semibold">Heading 2</h2>
        <h3 className="text-2xl font-medium">Heading 3</h3>
        <p className="text-base">
          This is a paragraph of text. It demonstrates the default body copy style for the application.
          You can use this for descriptions, instructions, and other informational content.
        </p>
        <p className="text-sm text-gray-500">
          This is a muted paragraph, for less important text.
        </p>
      </section>

      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Default</Button>
          <Button color="red">Destructive</Button>
          <Button color="gray">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="light">Light</Button>
          <Button variant="subtle">Subtle</Button>
        </div>
      </section>
    </div>
  );
};

export default StyleGuide;
