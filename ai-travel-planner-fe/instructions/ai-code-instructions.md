# Project Setup and Development Guidelines

## Overview
This is a modern React frontend application built with TypeScript, Vite, and Tailwind CSS. The project follows a feature-based architecture with shadcn/ui components and emphasizes type safety, clean code organization, and developer experience.

## Technology Stack

### Core Framework & Language
- **React 19** - Latest React with concurrent features
- **TypeScript 6.0** - Strict type checking enabled
- **Vite 8.0** - Fast build tool and dev server

### Styling & UI
- **Tailwind CSS 4.2** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI primitives
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Icon library
- **Geist Font** - Modern typography

### Routing & State
- **React Router DOM 7.14** - Client-side routing
- **Context API** - State management (via providers pattern)

### Development Tools
- **ESLint 9** - Code linting with TypeScript and React rules
- **Prettier** - Code formatting
- **TypeScript ESLint** - Type-aware linting rules

## Project Structure

```
src/
├── app/                    # Main application logic
│   ├── index.tsx          # Root App component
│   ├── providers/         # Context providers
│   │   └── index.tsx
│   ├── router/            # Routing configuration
│   │   └── index.tsx
│   └── styles/            # Global styles (if needed)
├── entities/              # Domain entities (placeholder for future use)
├── lib/                   # Utilities and helpers
│   └── utils.ts           # Core utilities (cn function, etc.)
├── modules/               # Feature modules with business logic
│   ├── Auth/             # Authentication module
│   │   ├── AuthModule.tsx       # Main Auth module component
│   │   ├── components/
│   │   │   ├── AuthForm.tsx     # Main auth form with toggle
│   │   │   ├── SignInForm.tsx   # Sign in form
│   │   │   └── SignUpForm.tsx   # Sign up form
│   │   └── model/
│   │       └── scheme.ts        # Validation schemas
│   └── [Feature]/        # Other feature modules follow same pattern
├── pages/                 # Page components (wrappers for modules/routes)
│   ├── AuthPage.tsx       # Login page
│   ├── DashboardPage.tsx  # Dashboard (main content)
│   ├── AnalyticsPage.tsx  # Analytics page
│   ├── ReportsPage.tsx    # Reports page
│   ├── SettingsPage.tsx   # Settings page
│   └── MainPage.tsx       # Legacy main page
├── shared/                # Shared code across features
│   ├── api/              # API clients and services
│   ├── constants/        # Application constants
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Shared utilities
│   ├── ui/               # Shared UI components and layouts
│   │   ├── AppLayout.tsx       # Main app layout with sidebar
│   │   ├── AppHeader.tsx       # Header component
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── CompanyLogo.tsx     # Company logo component
│   │   ├── PasswordField.tsx   # Password input component
│   │   ├── TextField.tsx       # Text field component
│   │   ├── field.tsx           # Field wrapper component
│   │   ├── card.tsx            # Card component
│   │   ├── button.tsx          # Button component
│   │   ├── input.tsx           # Input component
│   │   ├── label.tsx           # Label component
│   │   └── separator.tsx       # Separator component
│   └── utils/            # Shared utility functions
├── assets/               # Static assets
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)
- Uses project references for better build performance
- Path mapping: `@/*` → `./src/*`
- Target: ES2023
- JSX: `react-jsx`
- Strict linting: `noUnusedLocals`, `noUnusedParameters`

### ESLint Configuration (`eslint.config.js`)
- Flat config format
- Rules:
  - `@typescript-eslint/no-unused-vars`: Warn with ignore patterns for `_`
  - `@typescript-eslint/no-explicit-any`: Off (flexible typing)
  - `@typescript-eslint/consistent-type-imports`: Prefer type imports
  - `react-refresh/only-export-components`: Warn for hot reload optimization
  - `no-console`: Allow `warn` and `error`
  - `no-debugger`: Warn

### Vite Configuration (`vite.config.ts`)
- React plugin with SWC
- Tailwind CSS plugin
- Path alias: `@` → `./src`

### Routing Configuration
- Nested routes with layout wrapper
- Main routes are wrapped in `AppLayout` which provides sidebar and header
- Login route is separate (outside layout)
- Lazy-loadable feature routes for future optimization
- Path structure:
  - `/login` - Authentication page
  - `/` - Dashboard (default)
  - `/analytics` - Analytics page
  - `/reports` - Reports page
  - `/settings` - Settings page

## Architectural Patterns

### Module-Based Architecture
The project uses a modular feature-based architecture where each major feature is organized as a module:

**Module Structure (e.g., `modules/Auth/`):**
```
ModuleName/
├── ModuleNameModule.tsx    # Main module component (exported as default)
├── components/             # UI components specific to this module
│   ├── ComponentName.tsx
│   └── AnotherComponent.tsx
└── model/                  # Business logic, types, schemas
    └── scheme.ts           # Validation schemas, types, constants
```

**Module Pattern:**
- Each module exports a default component (e.g., `AuthModule`)
- Pages act as wrappers that import and render the appropriate module
- Components within a module folder handle UI logic specific to that feature
- `model/` folder contains business logic, validation schemas, and TypeScript types
- Modules are self-contained and can be independently tested and maintained

**Page Pattern:**
- Pages are thin wrappers located in `pages/` folder
- Pages import and render modules/components
- Pages handle route parameters if needed
- Example: `LoginPage` imports and renders `AuthModule`

### Layout Pattern
- `AppLayout` component wraps all authenticated routes
- Provides `Sidebar` for navigation and `AppHeader` for top actions
- Uses `Outlet` from React Router for nested route rendering
- Keeps navigation and header state consistent across app

### Form Components Pattern
- Reusable form components: `TextField`, `PasswordField`, custom field wrappers
- Forms contain validation logic integrated with schemas
- Field components handle styling and accessibility
- Consistent error messaging and validation feedback

## Coding Standards & Rules

### 1. Component Structure
- Use functional components with arrow functions
- Prefer named exports over default exports
- Use TypeScript interfaces for props
- Follow the pattern: `export const ComponentName = () => {}`
- Keep components small and focused on single responsibility
- **Module Components**: Use default export for main module component only (e.g., `export default AuthModule`)
- **Sub-components**: Use named exports for components within module's `components/` folder

### 2. TypeScript Usage
- Use strict TypeScript settings
- Prefer `type` imports over `import type`
- Use proper type annotations for all function parameters
- Leverage utility types (`Partial`, `Pick`, `Omit`, etc.)
- Avoid `any` type except when necessary

### 3. Styling Conventions
- Use Tailwind CSS classes directly in components
- Use the `cn()` utility for conditional classes
- Follow shadcn/ui component patterns with CVA (Class Variance Authority)
- Use CSS variables for theming
- Maintain consistent spacing and typography

### 4. File Organization
- Group related files in feature-based folders
- Use index files for clean imports: `export * from './Component'`
- Keep utilities in dedicated `lib` or `utils` folders
- Separate business logic from presentation components

### 5. Naming Conventions
- Components: PascalCase (`Button`, `UserCard`)
- Files: PascalCase for components, camelCase for utilities
- Hooks: camelCase with `use` prefix (`useAuth`, `useLocalStorage`)
- Types: PascalCase with descriptive names (`UserData`, `ApiResponse`)

### 6. Import Organization
- Group imports by type: React, third-party, internal
- Use path aliases (`@/components`, `@/lib/utils`, `@/modules`, `@/pages`, `@/shared`)
- Prefer absolute imports over relative imports
- Sort imports alphabetically within groups
- Import modules and pages: `import AuthModule from '@/modules/Auth/AuthModule'`
- Import shared UI components: `import { Button, Card } from '@/shared/ui'`

### 7. State Management
- Use React Context for global state
- Implement providers pattern in `app/providers/`
- Use custom hooks for stateful logic
- Keep state as close to usage as possible

### 8. API Integration & Validation
- Place API clients in `shared/api/`
- Place validation schemas in module's `model/scheme.ts`
- Use consistent error handling patterns
- Implement proper TypeScript types for API responses
- Consider using React Query or SWR for data fetching
- Validation schemas should include both form validation and type definitions
- Use validation results for form error display and submission handling

### 9. Performance Considerations
- Use React.memo for expensive components
- Implement proper key props in lists
- Lazy load routes and heavy components
- Optimize bundle size with dynamic imports

### 10. Testing Guidelines
- Write unit tests for utilities and hooks
- Integration tests for components
- Use React Testing Library for component testing
- Mock external dependencies appropriately

## Development Workflow

### Setup
```bash
npm install
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Adding New Components
1. Use shadcn/ui CLI for UI components: `npx shadcn@latest add [component]`
2. Place domain components in appropriate feature folders
3. Follow the established patterns and TypeScript conventions
4. Update exports in index files

### Creating New Modules
1. Create a folder under `src/modules/ModuleName/`
2. Create `ModuleName.tsx` as the main module component (default export)
3. Create `components/` subfolder for UI components specific to the module
4. Create `model/` subfolder with `scheme.ts` for validation and types
5. Import the module in the corresponding page component
6. Add route configuration in `app/router/index.tsx` if needed
7. Follow this structure:
   ```typescript
   // ModuleName/ModelNameModule.tsx
   import SomeComponent from './components/SomeComponent'
   
   const ModelNameModule = () => {
     return <SomeComponent />
   }
   
   export default ModelNameModule
   ```

### Form Field Components
- Use `TextField` for text inputs with built-in styling
- Use `PasswordField` for password inputs
- Create field components that wrap `input` with consistent styling
- Integrate validation with form submission
- Provide clear error messages from validation schema

### Code Quality
- Run `npm run lint` before commits
- Use `npm run format` to maintain consistent formatting
- Address all ESLint warnings and errors
- Write self-documenting code with clear variable names

## Best Practices

### React Patterns
- Use custom hooks for reusable logic
- Implement compound components where appropriate
- Follow React's composition over inheritance principle
- Use children prop for flexible component APIs

### Error Handling
- Implement error boundaries for critical sections
- Use try-catch in async operations
- Provide user-friendly error messages
- Log errors appropriately (console.warn/error allowed)

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers

### Security
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production
- Implement proper authentication flows

This instruction provides a comprehensive guide for maintaining consistency, code quality, and developer experience in this React TypeScript project. Follow these guidelines to ensure new code integrates seamlessly with the existing codebase.