// `fs` for Tailwind's core inside the build worker. Tailwind reads one file itself, its preflight stylesheet; the
// project's content comes in as text, so nothing else is read.
// `?raw` is webpack's asset/source rule (webpack.config.js), which eslint's resolver does not know.
// eslint-disable-next-line import/no-unresolved
import preflight from 'tailwindcss/lib/css/preflight.css?raw';

const readFileSync = (file) => {
  if (String(file).endsWith('preflight.css')) return preflight;
  throw new Error(`Tailwind tried to read ${file}, which the browser build does not provide`);
};

export default { readFileSync, promises: { readFile: async (file) => readFileSync(file) }, existsSync: () => false };
export { readFileSync };
