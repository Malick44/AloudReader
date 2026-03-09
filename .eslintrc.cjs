/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['node_modules', 'dist', '.expo', 'web-build'],
  rules: {
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      excludedFiles: ['src/styles/tokens/**/*.{ts,tsx}', 'tailwind.config.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "Literal[value=/^(#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})|rgb\\(|hsl\\()/]",
            message:
              'Raw color literals are not allowed outside src/styles/tokens/**. Use semantic token classes.',
          },
          {
            selector: "JSXAttribute[name.name='className'] Literal[value=/\\[[^\\]]+\\]/]",
            message:
              'Arbitrary Tailwind values are blocked. Add a token and semantic class instead.',
          },
          {
            selector: 'JSXElement JSXText[value=/\\S+/]',
            message:
              'Hard-coded JSX text is blocked. Move user-visible text to src/i18n and call t().',
          },
          {
            selector:
              "JSXAttribute[name.name=/^(label|title|placeholder|headerTitle|message|description)$/][value.type='Literal'][value.value=/\\S+/]",
            message:
              'Hard-coded display prop text is blocked. Move user-visible text to src/i18n and call t().',
          },
          {
            selector:
              "JSXAttribute[name.name=/^(label|title|placeholder|headerTitle|message|description)$/] JSXExpressionContainer > Literal[value=/\\S+/]",
            message:
              'Hard-coded display prop text is blocked. Move user-visible text to src/i18n and call t().',
          },
          {
            selector: "JSXElement[openingElement.name.name='Text'] JSXExpressionContainer > Literal[value=/\\S+/]",
            message:
              'Hard-coded Text literal is blocked. Move user-visible text to src/i18n and call t().',
          },
        ],
      },
    },
    {
      files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      excludedFiles: ['src/data/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@supabase/supabase-js',
                message: 'Import Supabase only from src/data/** via repository interfaces.',
              },
            ],
          },
        ],
      },
    },
  ],
};
