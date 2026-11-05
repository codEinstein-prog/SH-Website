import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Ignore build/dist folders
  { ignores: ['dist', '.next', 'node_modules'] },
  
  // Base JS and TypeScript configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // React & TSX specific config
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect', // Automatically detects your React version
      },
    },
    rules: {
      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed in modern React (17+)
      'react/jsx-uses-react': 'off',
      
      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // TypeScript rules custom overrides
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  }
);