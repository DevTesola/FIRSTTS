# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run all tests
- `npm run test -- -t "test name"` - Run specific test

## Code Style Guidelines

- **ESModule Format**: Use ES modules (`import`/`export`)
- **React Components**: Use function components with hooks
- **JSX**: Use .jsx extension for React components
- **Formatting**: 2-space indentation, no semicolons in JSX files
- **Types**: Use JSDoc comments for type documentation
- **Imports**: Group imports (React, libraries, components, utils)
- **Error Handling**: Use try/catch blocks with console.error for graceful degradation
- **State Management**: Use React context for shared state
- **Responsiveness**: Include mobile-specific handling
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Solana Integration**: Follow wallet adapter patterns for blockchain interactions