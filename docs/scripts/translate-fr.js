#!/usr/bin/env node
/**
 * Keeps the French (fr) docs locale in sync with versioned_docs/version-3.16.0-LTS.
 *
 * For every content run it also refreshes the sidebar-label / theme UI-string
 * translation files (via `docusaurus write-translations`) and fills in any
 * entries that are still untranslated.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/translate-fr.js
 *
 * Only files whose source content hash changed since the last run are
 * re-translated (tracked in scripts/.translation-manifest.json), so repeat
 * runs are cheap and this is safe to call on every docs update.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');

const DOCS_ROOT = path.join(__dirname, '..');
const VERSION_NAME = 'version-3.16.0-LTS';
const SOURCE_DIR = path.join(DOCS_ROOT, 'versioned_docs', VERSION_NAME);
const TARGET_DIR = path.join(DOCS_ROOT, 'i18n', 'fr', 'docusaurus-plugin-content-docs', VERSION_NAME);
const MANIFEST_PATH = path.join(__dirname, '.translation-manifest.json');
const UI_MANIFEST_PATH = path.join(__dirname, '.ui-translation-manifest.json');
const MODEL = process.env.TRANSLATE_MODEL || 'claude-sonnet-5';
const CONCURRENCY = 5;

const anthropic = new Anthropic();

const TRANSLATION_SYSTEM_PROMPT = `You translate ToolJet product documentation (Markdown/MDX) from English to French for a technical audience.

Rules — follow exactly:
- Translate prose, headings, list items, table cell text, and admonition (:::note/:::tip/:::warning/:::danger/:::info) content into natural, fluent French.
- Do NOT translate: code blocks (fenced with \`\`\`), inline code (\`like this\`), MDX/JSX component names, props, or import statements, front-matter keys, URLs/paths, image sources, HTML comments, or literal UI strings quoted from the ToolJet product itself (e.g. "click 'Add new query'") — the product UI is English-only, so keep quoted UI labels in English inside otherwise-French sentences.
- In YAML front matter (--- ... ---), keep all keys in English and translate only the human-readable values of title, sidebar_label, and description. Leave id, slug, and other keys untouched.
- Keep ToolJet-specific product/technical nouns as commonly used in French technical writing (e.g. "widget", "workflow", "plugin", "dashboard", "webhook", "query") rather than forcing an unnatural literal translation.
- Preserve the exact Markdown/MDX structure: same headings, same number of code blocks, same links (translate visible link text, never the URL), same JSX tags and attributes.
- Output ONLY the translated file content. No commentary, no wrapping code fence around the whole file.`;

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

async function translateFile(sourcePath) {
  const content = fs.readFileSync(sourcePath, 'utf8');
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });
  return response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
}

async function runWithConcurrency(items, limit, worker) {
  const results = [];
  let cursor = 0;
  async function next() {
    const i = cursor++;
    if (i >= items.length) return;
    results[i] = await worker(items[i], i);
    await next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

async function syncContent() {
  const manifest = loadManifest();
  const sourceFiles = walk(SOURCE_DIR, ['.md', '.mdx']);
  const sourceRelPaths = new Set(sourceFiles.map((f) => path.relative(SOURCE_DIR, f)));

  // Drop translations for files that no longer exist in the source.
  for (const relPath of Object.keys(manifest)) {
    if (!sourceRelPaths.has(relPath)) {
      const stale = path.join(TARGET_DIR, relPath);
      if (fs.existsSync(stale)) fs.unlinkSync(stale);
      delete manifest[relPath];
    }
  }

  const pending = [];
  for (const sourcePath of sourceFiles) {
    const relPath = path.relative(SOURCE_DIR, sourcePath);
    const content = fs.readFileSync(sourcePath, 'utf8');
    const hash = sha256(content);
    if (manifest[relPath] !== hash) {
      pending.push({ sourcePath, relPath, hash });
    }
  }

  if (pending.length === 0) {
    console.log('translate-fr: content already up to date.');
  } else {
    console.log(`translate-fr: translating ${pending.length} changed file(s)...`);
    await runWithConcurrency(pending, CONCURRENCY, async ({ sourcePath, relPath, hash }) => {
      const translated = await translateFile(sourcePath);
      const targetPath = path.join(TARGET_DIR, relPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, translated);
      manifest[relPath] = hash;
      saveManifest(manifest);
      console.log(`  translated ${relPath}`);
    });
  }

  saveManifest(manifest);
}

function collectStrings(node, out, pathPrefix = []) {
  if (node && typeof node === 'object' && 'message' in node && 'description' in node) {
    out.push({ path: pathPrefix, message: node.message });
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      collectStrings(value, out, [...pathPrefix, key]);
    }
  }
}

function setAtPath(obj, pathParts, value) {
  let cur = obj;
  for (const key of pathParts.slice(0, -1)) cur = cur[key];
  cur[pathParts[pathParts.length - 1]].message = value;
}

async function translateStringBatch(strings) {
  if (strings.length === 0) return [];
  const numbered = strings.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      'Translate each numbered UI/documentation label into natural, concise French, keeping ToolJet product nouns (widget, workflow, plugin, dashboard, query, webhook, etc.) as commonly used in French technical writing. Reply with the same numbered list, translations only, one per line, no extra commentary.',
    messages: [{ role: 'user', content: numbered }],
  });
  const text = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean);
}

async function syncUiStrings() {
  execSync('npx docusaurus write-translations --locale fr', { cwd: DOCS_ROOT, stdio: 'inherit' });

  const uiManifest = fs.existsSync(UI_MANIFEST_PATH) ? JSON.parse(fs.readFileSync(UI_MANIFEST_PATH, 'utf8')) : {};
  const i18nDir = path.join(DOCS_ROOT, 'i18n', 'fr');
  const jsonFiles = walk(i18nDir, ['.json']);

  for (const file of jsonFiles) {
    const relFile = path.relative(DOCS_ROOT, file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const allStrings = [];
    collectStrings(data, allStrings);

    // Only translate entries we haven't already translated in a prior run —
    // write-translations preserves existing (already-French) values on merge,
    // but re-scanning them here would translate French back through French.
    const pending = allStrings.filter((entry) => !uiManifest[`${relFile}#${entry.path.join('.')}`]);
    if (pending.length === 0) continue;

    const translations = await translateStringBatch(pending.map((u) => u.message));
    pending.forEach((entry, i) => {
      if (translations[i]) {
        setAtPath(data, entry.path, translations[i]);
        uiManifest[`${relFile}#${entry.path.join('.')}`] = true;
      }
    });
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    fs.writeFileSync(UI_MANIFEST_PATH, JSON.stringify(uiManifest, null, 2) + '\n');
    console.log(`  translated ${pending.length} UI string(s) in ${relFile}`);
  }
}

async function main() {
  await syncContent();
  await syncUiStrings();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
