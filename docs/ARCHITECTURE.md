# 🏛 Architecture

## Overview

Country Tracker is designed with a decoupled architecture to support multiple backend implementations. The frontend application layer interacts with backend services through a set of TypeScript interfaces. This abstraction allows the application to switch between different backends (like PocketBase or Firebase) or support custom implementations without changing the UI components or core business logic.

## Backend Abstraction Layer

The abstraction layer is located in `src/lib/services/` and consists of two main parts:

### 1. Interfaces

Defined in `src/lib/services/interfaces.ts`, these files specify the contracts that any backend implementation must fulfill:

-   **`IAuthService`**: Handles user authentication, including sign-in, sign-out, and listening to authentication state changes.
-   **`IUserRepository`**: Manages user profiles, visited countries lists, privacy settings, and global leaderboard data.
-   **`IFriendsRepository`**: Manages friend requests, accepting/declining requests, and retrieving friends lists.
-   **`IGroupRepository`**: Handles creation and management of private groups, group members, and group-specific leaderboards.

### 2. Service Registry

The `ServiceRegistry` class in `src/lib/services/registry.ts` is a singleton that acts as a factory for services. It reads the `NEXT_PUBLIC_BACKEND_TYPE` environment variable to determine which concrete implementation to instantiate and return to the application.

## Data Caching with SWR

To ensure a highly performant user experience and minimize unnecessary network requests, Country Tracker heavily utilizes the `useSWR` hook for data fetching and caching.

-   **Automatic Caching**: Fetched data is cached globally.
-   **Background Revalidation**: SWR serves cached data first while revalidating from the backend in the background.
-   **Real-time Feel**: Components sharing the same SWR key automatically update when data changes, eliminating the need for complex global state management or prop drilling.
-   **Optimistic Updates**: Mutating data updates the local cache immediately for a snappy feel, with rollback on failure.

## Data Normalization

While application state handles clean JavaScript objects defined by the interfaces, backend implementations are responsible for mapping these to their specific data storage patterns.

-   **Firebase**: Maps directly to Firestore documents and collections, utilizing sub-collections for structured data like group memberships.
-   **PocketBase**: Maps to relational-style collections in SQLite, handling queries and expansions through the PocketBase SDK.

## Custom Backend Implementation

You can implement your own backend by following these steps:

1.  **Implement Interfaces**: Create a new directory under `src/lib/services/` and create implementations for `IAuthService`, `IUserRepository`, `IFriendsRepository`, and `IGroupRepository`.
2.  **Register the Implementation**: Update `src/lib/services/registry.ts` to include your new backend type in the switch statement, instantiating your classes.
3.  **Configure Environment**: Set `NEXT_PUBLIC_BACKEND_TYPE` in your `.env.local` to your new identifier and add any backend-specific connection strings or keys.

### Build Configuration for Custom Backends

To build or containerize the application with a custom backend (or an alternative like Firebase), the build process reads environment variables from a `.env` file rather than hardcoding variables in the `Dockerfile`.

#### 1. Provide Environment Variables Before Building
Populate a `.env` file with your custom backend variables before running `npm run build` or `docker build`. This ensures Next.js inlines any `NEXT_PUBLIC_*` variables during compilation:

```env
NEXT_PUBLIC_BACKEND_TYPE="mycustom"
NEXT_PUBLIC_MY_CUSTOM_VAR="your-custom-value"
```

#### 2. Update `next.config.ts` (Optional but Recommended)
Add validation logic to `validateConfig()` to ensure the build fails fast if your required variables are missing from the build environment.

Example:
```typescript
  if (backendType === 'mycustom') {
    const required = ['NEXT_PUBLIC_MY_CUSTOM_VAR'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for MyCustom backend: ${missing.join(', ')}`);
    }
  }
```

The `Dockerfile` is backend-agnostic and does not need modification for new variables, as it automatically copies the `.env` file during the build stage.

## Country List Configuration

To remain completely neutral and avoid hardcoded geopolitical assumptions, the repository does not bundle a static list of countries in source code. Instead, each deployment supplies its own country list via `config/countries.json` (or a custom file path specified by `COUNTRIES_CONFIG_PATH`).

- **Schema & Template**: See [`config/countries.schema.json`](../config/countries.schema.json) and [`config/countries.example.json`](../config/countries.example.json).
- **Flag Rendering**: Any 2-letter `code` (`^[A-Za-z]{2}$`) automatically renders its corresponding Unicode Regional Indicator flag emoji. An optional `"flag"` property on any entry can override the generated emoji.
- **Map Highlighting**: Entries with a 3-digit numeric ISO code (`ccn3`, e.g., `"004"`) automatically highlight matching geometry polygons on the D3 TopoJSON world map.
- **Non-Breaking Updates Across Redeployments**: User profiles only persist an array of visited `code` strings in the database. Adding, renaming, or removing entries in `config/countries.json` and redeploying automatically filters progress summaries, public profiles, and leaderboards against the active country list without destructively modifying historical user data.

