#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const localesRoot = path.join(projectRoot, 'src', 'i18n', 'locales');
const sourceLocale = 'en-US';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function flattenObject(input, prefix = '', output = {}) {
  for (const [key, value] of Object.entries(input)) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, nextPath, output);
      continue;
    }
    output[nextPath] = value;
  }
  return output;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const sourceFile = path.join(localesRoot, sourceLocale, 'translation.json');
const sourceFlat = flattenObject(readJson(sourceFile));
const sourceKeys = Object.keys(sourceFlat).sort();

for (const key of sourceKeys) {
  const value = sourceFlat[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`en-US key must contain a non-empty string: ${key}`);
  }
}

const localeDirectories = fs
  .readdirSync(localesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((locale) => locale !== sourceLocale);

for (const locale of localeDirectories) {
  const localeFile = path.join(localesRoot, locale, 'translation.json');
  const localeFlat = flattenObject(readJson(localeFile));
  const localeKeys = Object.keys(localeFlat);

  const missingKeys = sourceKeys.filter((key) => !Object.prototype.hasOwnProperty.call(localeFlat, key));
  const orphanKeys = localeKeys.filter((key) => !Object.prototype.hasOwnProperty.call(sourceFlat, key));

  if (missingKeys.length > 0) {
    fail(`Locale ${locale} is missing keys:\n${missingKeys.map((key) => `  - ${key}`).join('\n')}`);
  }

  if (orphanKeys.length > 0) {
    fail(`Locale ${locale} has keys not in en-US:\n${orphanKeys.map((key) => `  - ${key}`).join('\n')}`);
  }
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

console.log(`i18n locale check passed for ${1 + localeDirectories.length} locales.`);
