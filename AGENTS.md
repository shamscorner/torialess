# AGENTS.md - Torialess Development Guide

This file contains essential information for agentic coding agents working in the Torialess repository.

## Project Overview

Torialess is a collection of focused tools for content creators, built with Astro, React, and Svelte. The project emphasizes minimal, distraction-free utilities that help creators work efficiently.

## Build & Development Commands

### Core Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev              # Runs at localhost:4321

# Build for production
npm run build            # Builds to ./dist/

# Preview production build
npm run preview         # Wrangler dev for local preview

# Astro CLI commands
npm run astro add       # Add Astro integrations
npm run astro check     # Type checking
npm run astro -- --help # Get help with Astro CLI
```

### Linting & Testing

This project currently does not have dedicated lint or test scripts configured. When making changes:

- Use TypeScript strict mode (already configured)
- Follow the existing code patterns and conventions
- Test changes manually in the dev server

## Code Architecture

### Framework Stack

- **Astro** - Main framework with static site generation
- **React 19** - For interactive components (focused-todos)
- **Svelte 5** - For interactive components (svg-preview)
- **Tailwind CSS v4** - Styling with Vite integration
- **TypeScript** - Strict mode enabled

### Directory Structure

```
src/
├── components/          # Reusable Astro components
│   ├── navbar.astro
│   ├── footer.astro
│   └── analytics/      # Analytics components
├── layouts/            # Page layouts
│   └── layout.astro
├── pages/              # Route-based pages
│   ├── index.astro
│   ├── focused-todos/
│   │   └── index.astro
│   └── svg-preview/
│       └── index.astro
├── lib/                # Utility functions
│   └── utils.ts
├── constants/          # Application constants
│   └── index.ts
├── assets/             # Static assets
└── styles/             # Global styles
    └── global.css
```

### Import Path Aliases

Use these configured path aliases for clean imports:

```typescript
@/*                 -> ./src/*
@components/*      -> src/components/*
@assets/*          -> src/assets/*
@layouts/*         -> src/layouts/*
@utils/*           -> src/utils/*
@constants/*       -> src/constants/*
@pages/*           -> src/pages/*
```

## Code Style Guidelines

### TypeScript & General

- **Strict mode**: TypeScript strict mode is enabled
- **Explicit types**: Use explicit types for function parameters and return values when they enhance clarity
- **Prefer const**: Use `const` by default, `let` only when reassignment is needed
- **Modern syntax**: Use arrow functions, destructuring, template literals, optional chaining (`?.`), nullish coalescing (`??`)
- **No `any`**: Prefer `unknown` over `any` when type is genuinely unknown
- **Useful naming**: Use descriptive variable and function names over magic numbers

### React Components

- **Function components only**: Use function components over class components
- **TypeScript interfaces**: Define clear interfaces for props and state
- **Hook rules**: Call hooks at top level only, specify all dependencies correctly
- **Forward refs**: Use `forwardRef` when refs are needed
- **Semantic HTML**: Use proper HTML elements and ARIA attributes for accessibility
- **Error boundaries**: Handle errors appropriately with try-catch blocks

### Svelte Components

- **Svelte 5 syntax**: Use modern Svelte 5 with `$state` runes
- **Event handlers**: Use `on:click` and other event handlers appropriately
- **Reactive statements**: Use `$:` for reactive computations when needed
- **Accessibility**: Include proper ARIA attributes and semantic markup

### Styling & UI

- **Tailwind first**: Use Tailwind CSS classes for styling
- **Utility functions**: Use `cn()` from `@/lib/utils` for conditional classes
- **Responsive design**: Use Tailwind's responsive prefixes (md:, lg:, etc.)
- **Dark themes**: Many tools use dark backgrounds - maintain consistency
- **Component patterns**: Follow existing component patterns for consistency

### Astro Pages/Components

- **Frontmatter**: Use Astro frontmatter for imports and logic
- **Props interface**: Define TypeScript interfaces for props
- **Slot usage**: Use `<slot />` for content injection
- **Partial hydration**: Use `client:*` directives appropriately

## Component Patterns

### File Naming

- **Components**: PascalCase (e.g., `FocusedTodos.tsx`, `SvgPreview.svelte`)
- **Pages**: lowercase with hyphens (e.g., `focused-todos/`)
- **Utilities**: camelCase (e.g., `utils.ts`)

### Tool Implementation Pattern

Each tool in Torialess follows this pattern:

1. **Route**: `src/pages/tool-name/index.astro`
2. **Layout**: Uses base layout with `lonely={true}` for full-screen tools
3. **Component**: Main component in `_components/tool-name.{tsx,svelte}`
4. **Standalone**: Tools work independently without dependencies

### Example Structure

```
src/pages/my-tool/
├── index.astro                 # Page wrapper
└── _components/
    └── my-tool.tsx            # Main React component
    # OR
    └── my-tool.svelte         # Main Svelte component
```

## Error Handling & Debugging

- **No console logs**: Remove `console.log`, `debugger`, `alert` from production code
- **Throw errors**: Throw `Error` objects with descriptive messages
- **Meaningful try-catch**: Handle errors appropriately in async code
- **Early returns**: Use early returns to reduce nesting
- **User feedback**: Provide clear error messages to users when appropriate

## Performance Guidelines

- **Astro islands**: Use partial hydration strategically
- **Image optimization**: Use proper image handling (no barrel files)
- **Bundle size**: Prefer specific imports over namespace imports
- **Lazy loading**: Consider lazy loading for heavy components
- **Local storage**: Use localStorage for persistence when appropriate (see focused-todos)

## Testing & Quality Assurance

- **Manual testing**: Test tools manually in development
- **Cross-browser**: Ensure tools work in major browsers
- **Responsive design**: Test on mobile and desktop
- **Accessibility**: Check keyboard navigation and screen readers
- **Error states**: Test error conditions and edge cases

## Security Considerations

- **External links**: Add `rel="noopener"` for `target="_blank"` links
- **Input validation**: Validate and sanitize user input
- **No eval()**: Avoid `eval()` and similar dangerous functions
- **Content security**: Be careful with dynamic HTML injection

## Committing Changes

Follow these steps when committing changes:

1. **Test thoroughly**: Ensure all functionality works as expected
2. **Run build**: `npm run build` should complete without errors
3. **Type checking**: Ensure TypeScript passes without issues
4. **Clear messages**: Use descriptive commit messages explaining the "why"
5. **Focused commits**: Keep changes focused and atomic

## Adding New Tools

When adding a new tool to Torialess:

1. **Create route**: Add new directory under `src/pages/`
2. **Follow patterns**: Use existing tool structure as reference
3. **Update navigation**: Add link to navbar if appropriate
4. **Add to README**: Update the available tools list
5. **Test thoroughly**: Ensure tool works independently

## Framework-Specific Notes

### React 19+

- Use `ref` as prop instead of `React.forwardRef` when possible
- Leverage new React 19 features where beneficial

### Astro

- Use `client:*` directives for components needing hydration
- Leverage Astro's static generation for optimal performance
- Use Astro integrations for additional functionality

### Svelte 5

- Use modern `$state` syntax for reactivity
- Follow Svelte best practices for component composition
- Use TypeScript for type safety

### Tailwind CSS v4

- Do not use `space-y-*` utilities; prefer `flex flex-col gap-y-*`

This guide should help agentic developers work effectively in the Torialess codebase. Always prioritize user experience, accessibility, and code maintainability.
