# Linting Guide

This document provides guidance on fixing linting errors in the project.

## Current Status

The project currently has a large number of linting errors that need to be addressed. These errors are primarily related to:

1. Unused imports and variables
2. Use of `any` types
3. React hooks rules violations
4. Missing dependencies in useEffect/useCallback hooks

## Automated Fixes

We've added a helper script to automatically fix some of the common issues:

```bash
npm run lint:fix
```

This script will:
1. Run ESLint with the `--fix` option to automatically fix issues that can be resolved
2. Run Prettier to ensure consistent formatting

## Manual Fixes

Many issues will require manual intervention. Here's how to address the most common ones:

### 1. Unused Imports and Variables

- Remove unused imports at the top of files
- For variables that are declared but not used:
  - Remove them if they're not needed
  - Use them if they're supposed to be part of the logic
  - Prefix with underscore (e.g., `_unusedVar`) if they're intentionally unused

### 2. Replacing `any` Types

Replace `any` types with more specific types:

```typescript
// Before
const data: any = fetchData();

// After
interface ResponseData {
  id: string;
  name: string;
  value: number;
}

const data: ResponseData = fetchData();
```

### 3. React Hooks Rules Violations

React hooks must be called at the top level of a component, not inside conditionals:

```typescript
// Incorrect
if (condition) {
  useEffect(() => {
    // do something
  }, []);
}

// Correct
useEffect(() => {
  if (condition) {
    // do something
  }
}, [condition]);
```

### 4. Missing Dependencies in useEffect/useCallback

Add all variables used inside the hook to the dependency array:

```typescript
// Before
useEffect(() => {
  console.log(userData);
  fetchData(userId);
}, []); // Missing dependencies

// After
useEffect(() => {
  console.log(userData);
  fetchData(userId);
}, [userData, userId, fetchData]);
```

## Step-by-Step Approach

1. Start with running `npm run lint:fix` to fix automatic issues
2. Run `npm run lint` to see remaining issues
3. Fix issues in one file at a time, focusing on:
   - First removing unused imports/variables
   - Then fixing type issues
   - Finally addressing React hooks issues
4. Re-run `npm run lint` to verify fixes

## Re-enabling Linting in Pre-commit Hook

Once the major linting issues are fixed, we should re-enable linting in the pre-commit hook:

1. Edit `.husky/pre-commit` to uncomment the linting check
2. Remove the `.eslintignore` file or update it to only ignore specific files that still need work

## Common ESLint Rules in this Project

- `@typescript-eslint/no-unused-vars`: Disallows unused variables
- `@typescript-eslint/no-explicit-any`: Disallows the use of the `any` type
- `react-hooks/rules-of-hooks`: Enforces Rules of Hooks
- `react-hooks/exhaustive-deps`: Verifies the dependency lists of useEffect and similar hooks

## Resources

- [ESLint Documentation](https://eslint.org/docs/user-guide/getting-started)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html) 