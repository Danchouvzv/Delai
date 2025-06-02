#!/usr/bin/env node

/**
 * This script helps fix common linting errors automatically.
 * It focuses on:
 * 1. Removing unused imports
 * 2. Fixing @typescript-eslint/no-unused-vars
 * 3. Adding proper types instead of 'any'
 * 
 * Usage:
 * node scripts/fix-lint-errors.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files in src directory
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Fix common linting errors
function fixLintingErrors() {
  console.log('Fixing common linting errors...');

  // 1. First run ESLint with --fix option to fix auto-fixable errors
  try {
    console.log('Running ESLint with --fix option...');
    execSync('npx eslint --fix "src/**/*.{ts,tsx}"', { stdio: 'inherit' });
  } catch (error) {
    console.log('ESLint found errors that could not be automatically fixed.');
  }

  // 2. Run Prettier to ensure consistent formatting
  try {
    console.log('\nRunning Prettier...');
    execSync('npm run format', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running Prettier:', error);
  }

  console.log('\nBasic automatic fixes applied. Some issues may still require manual fixes.');
  console.log('\nCommon manual fixes needed:');
  console.log('1. Replace "any" types with proper types');
  console.log('2. Fix React hooks that are called conditionally');
  console.log('3. Add missing dependencies to useEffect/useCallback dependency arrays');
  console.log('\nRun "npm run lint" to see remaining issues.');
}

// Main execution
console.log('Starting linting error fix script...');
fixLintingErrors(); 