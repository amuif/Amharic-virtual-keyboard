# Amharic Virtual Keyboard Monorepo

This monorepo contains multiple implementations of an Amharic virtual keyboard, designed to provide a consistent and easy-to-use input method for Amharic script across different web technologies.

## Project Structure

The project is organized into applications and shared packages using [Turborepo](https://turbo.build/repo).

### Apps

*   **[apps/svelte](./apps/svelte)**: A Svelte component implementation of the virtual keyboard.
*   **[apps/react](./apps/react)**: A React component implementation.
*   **[apps/html](./apps/html)**: A vanilla HTML/JavaScript implementation for use in non-framework environments.

### Packages

*   **[packages/core](./packages/core)**: The core logic, keyboard layouts, and state management shared across all implementations.
*   **[packages/eslint-config](./packages/eslint-config)**: Shared ESLint configurations.
*   **[packages/typescript-config](./packages/typescript-config)**: Shared TypeScript configurations.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (>= 18)
*   [pnpm](https://pnpm.io/) (>= 9)

### Installation

Install dependencies from the root directory:

```bash
pnpm install
```

### Development

To start the development servers for all applications:

```bash
pnpm dev
```

### Build

To build all apps and packages:

```bash
pnpm build
```
