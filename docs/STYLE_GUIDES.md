# Code Style Guides

## General Approach
The project follows Google's style guides for frontend development.

## TypeScript Style Guide
*Enforced via `gts` style rules.*
- **Variables:** Always use `const` or `let`. `var` is forbidden.
- **Classes/Modules:** Avoid `#private` fields (use TS `private`). No default exports, use strictly named exports. Do not use `namespace`.
- **Formatting:** Explicitly end all statements with a semicolon.
- **Nullability:** Prefer optional parameters (`?`) over explicit `| undefined`.
- **Comments:** Use JSDoc for documentation (`/** JSDoc */`), `//` for implementation comments. You MUST always add useful code comments when writing any code. All code must be commented very well to allow another engineer to easily follow what the code does. Explain the *why* and the high-level logic. Do not declare types in `@param` or `@return` blocks as this is redundant in TS.
- **Agent/AI Comments:** Never leave behind old, outdated, or "agent thinking" comments (e.g., "I will do X now", "TODO: agent to fix", etc.). Keep comments professional and relevant to the codebase.

## HTML/CSS Style Guide
- **Indentation:** 2 spaces.
- **Quotation:** Double quotes (`""`) for HTML attributes, single quotes (`''`) for CSS attribute selectors.
- **Classes:** Use meaningful, generic lowercase naming separated by hyphens (e.g. `.video-player`). Do NOT use ID selectors for styling.
- **Formatting:** Use 0 for values without units (e.g., `margin: 0;`). Include leading 0 for decimals (e.g., `0.8em`). Use shorthand where possible.
- **Separation:** Strictly separate structure (HTML), presentation (CSS), and behavior (JS). Link to CSS/JS via external files.

## Testing Style Guide
- **Requirement:** Every new feature, component, and code change must have corresponding unit tests.
- **Tools:** Use Jest and React Testing Library (or whatever testing framework is configured in the project).
- **Pre-commit Checks:** ALWAYS run the entire test suite and verify that all tests pass before committing. Committing code with failing or missing tests is strictly prohibited.
