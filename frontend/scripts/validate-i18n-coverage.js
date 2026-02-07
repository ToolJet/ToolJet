const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(FRONTEND_ROOT, 'src');
const WIDGET_DIR = path.join(SRC_DIR, 'AppBuilder', 'WidgetManager', 'widgets');
const TRANSLATION_DIR = path.join(FRONTEND_ROOT, 'assets', 'translations');
const LOCALE_FILES = fs
  .readdirSync(TRANSLATION_DIR)
  .filter((file) => file.endsWith('.json') && file !== 'languages.json')
  .sort();

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function flatten(obj, prefix = '', out = {}) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flatten(value, nextPrefix, out);
    }
  } else {
    out[prefix] = obj;
  }
  return out;
}

function walkFiles(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, fileList);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function collectStaticUsedKeys() {
  const files = walkFiles(SRC_DIR);
  const patterns = [
    /\bt\(\s*['"]([A-Za-z0-9_.-]+)['"]/g,
    /\bthis\.props\.t\(\s*['"]([A-Za-z0-9_.-]+)['"]/g,
    /\bi18n\.t\(\s*['"]([A-Za-z0-9_.-]+)['"]/g,
    /\bi18next\.t\(\s*['"]([A-Za-z0-9_.-]+)['"]/g,
    /\bi18nKey\s*=\s*['"]([A-Za-z0-9_.-]+)['"]/g,
  ];

  const keys = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }
  }

  return keys;
}

function collectWidgetKeys() {
  const widgetKeys = new Set();
  const files = fs.readdirSync(WIDGET_DIR).filter((file) => file.endsWith('.js'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(WIDGET_DIR, file), 'utf8');
    const widgetNameMatch = content.match(/name:\s*'([A-Za-z0-9_]+)'/);
    if (!widgetNameMatch) continue;

    const widgetName = widgetNameMatch[1];
    widgetKeys.add(`widget.${widgetName}.displayName`);
    widgetKeys.add(`widget.${widgetName}.description`);
  }

  return widgetKeys;
}

function hasKey(flatMap, key) {
  return Object.prototype.hasOwnProperty.call(flatMap, key);
}

function run() {
  const localeMaps = {};
  for (const file of LOCALE_FILES) {
    const locale = file.replace('.json', '');
    localeMaps[locale] = flatten(readJSON(path.join(TRANSLATION_DIR, file)));
  }

  if (!localeMaps.en) {
    console.error('Missing base locale: en.json');
    process.exit(1);
  }

  const enKeys = new Set(Object.keys(localeMaps.en));
  const staticUsedKeys = collectStaticUsedKeys();
  const widgetKeys = collectWidgetKeys();
  const requiredRuntimeKeys = new Set([...staticUsedKeys, ...widgetKeys]);

  let hasError = false;
  const errorLines = [];
  const warningLines = [];

  for (const [locale, map] of Object.entries(localeMaps)) {
    const localeKeys = new Set(Object.keys(map));
    const missingFromLocale = [...enKeys].filter((key) => !localeKeys.has(key));
    const extraInLocale = [...localeKeys].filter((key) => !enKeys.has(key));

    if (missingFromLocale.length > 0) {
      hasError = true;
      errorLines.push(
        `${locale}: missing ${missingFromLocale.length} keys from en (e.g. ${missingFromLocale
          .slice(0, 8)
          .join(', ')})`
      );
    }

    if (extraInLocale.length > 0) {
      warningLines.push(
        `${locale}: has ${extraInLocale.length} extra keys not in en (e.g. ${extraInLocale.slice(0, 8).join(', ')})`
      );
    }
  }

  for (const [locale, map] of Object.entries(localeMaps)) {
    const missingRuntimeKeys = [...requiredRuntimeKeys].filter((key) => !hasKey(map, key));
    if (missingRuntimeKeys.length > 0) {
      hasError = true;
      errorLines.push(
        `${locale}: missing ${missingRuntimeKeys.length} runtime keys (e.g. ${missingRuntimeKeys
          .slice(0, 8)
          .join(', ')})`
      );
    }
  }

  if (localeMaps.ja) {
    const criticalPrefixes = ['loginSignupPage.', 'forgotPasswordPage.', 'editor.emptyCanvas.'];
    const criticalJaEquality = [...requiredRuntimeKeys].filter((key) => {
      const isCriticalNamespace = criticalPrefixes.some((prefix) => key.startsWith(prefix));
      const isWidgetDisplayName = /^widget\.[A-Za-z0-9_]+\.displayName$/.test(key);
      if (!isCriticalNamespace && !isWidgetDisplayName) return false;
      return typeof localeMaps.en[key] === 'string' && typeof localeMaps.ja[key] === 'string' && localeMaps.en[key] === localeMaps.ja[key];
    });

    if (criticalJaEquality.length > 0) {
      hasError = true;
      errorLines.push(
        `ja: ${criticalJaEquality.length} critical keys still equal to en (e.g. ${criticalJaEquality
          .slice(0, 12)
          .join(', ')})`
      );
    }
  }

  if (hasError) {
    console.error('i18n coverage validation failed:\n');
    for (const line of errorLines) {
      console.error(`- ${line}`);
    }
    process.exit(1);
  }

  if (warningLines.length > 0) {
    console.warn('i18n coverage warnings:\n');
    for (const line of warningLines) {
      console.warn(`- ${line}`);
    }
    console.warn('');
  }

  console.log('i18n coverage validation passed.');
  console.log(`Locales checked: ${Object.keys(localeMaps).sort().join(', ')}`);
  console.log(`Runtime keys checked: ${requiredRuntimeKeys.size}`);
}

run();
