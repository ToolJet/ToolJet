// Shrinks server/templates for Docker images: template JSON is minified and Brotli-compressed
// (q11) into `<file>.json.br`, which TemplatesService.readTemplateJson() prefers over `.json`.
// Manifests are only minified. Run from the repo root: node server/scripts/compress-templates.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const templatesDir = path.join(__dirname, '..', 'templates');
const compressedFiles = ['definition.json', 'sample_app_def.json', 'onboard_sample_app.json'];

function minify(filePath) {
  return Buffer.from(JSON.stringify(JSON.parse(fs.readFileSync(filePath, 'utf-8'))));
}

function compress(filePath) {
  const json = minify(filePath);
  const compressed = zlib.brotliCompressSync(json, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: json.length,
    },
  });
  fs.writeFileSync(`${filePath}.br`, compressed);
  fs.unlinkSync(filePath);
}

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(entryPath);
    } else if (compressedFiles.includes(entry.name)) {
      compress(entryPath);
    } else if (entry.name === 'manifest.json') {
      fs.writeFileSync(entryPath, minify(entryPath));
    }
  }
}

processDir(templatesDir);
