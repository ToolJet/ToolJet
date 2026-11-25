import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

/*
  Creates an app project: app.json, README, .gitignore, and frontend/ from the code-app component template
  (shadcn + Tailwind, react-router, the theme on the app root, the popup portal) with the app's own starter page and
  router on top. Nothing here talks to a server.
*/

const templatesRoot = () => path.join(__dirname, '..', '..', '_templates', 'library', 'code-app');
const overlayRoot = () => path.join(__dirname, '..', '..', 'app-template');

/*
  The app's display name is the user's own text, so it is escaped for the file it lands in: a JSON string in .json, JSX
  text in .tsx and .jsx, as it is everywhere else (the README's heading). One pass with a replacer function: a `$` in the
  name stays a `$`, and a name that looks like a placeholder stays text.
*/
const inJsonString = (value: string) => JSON.stringify(value).slice(1, -1);
const inJsxText = (value: string) => (/[{}<>&\r\n]|^\s|\s$/.test(value) ? `{${JSON.stringify(value)}}` : value);

const fill = (text: string, vars: Record<string, string>, file: string) => {
  const escaped = /\.json$/.test(file) ? inJsonString : /\.[jt]sx$/.test(file) ? inJsxText : (value: string) => value;
  return text.replace(/<%=\s*(name|display_name)\s*%>|__DISPLAY_NAME__/g, (_, key) =>
    escaped(key === 'name' ? vars.name : vars.displayName)
  );
};

const copyTree = (from: string, to: string, vars: Record<string, string>) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    // Dot files are stored without their dot: npm never packs a .npmrc, and .gitignore is renamed on install.
    const dotted: Record<string, string> = { gitignore: '.gitignore', npmrc: '.npmrc' };
    const target = path.join(to, dotted[entry.name] ?? entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(target, { recursive: true });
      copyTree(source, target, vars);
    } else {
      fs.writeFileSync(target, fill(fs.readFileSync(source, 'utf8'), vars, target));
    }
  }
};

export function scaffoldApp(dir: string, displayName: string): { correlationId: string } {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) throw new Error(`${dir} already exists and is not empty`);
  const name = path
    .basename(path.resolve(dir))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
  const vars = { name, displayName };
  const frontend = path.join(dir, 'frontend');
  fs.mkdirSync(frontend, { recursive: true });

  // The component template's files, each written where its front matter says, under frontend/.
  for (const file of fs.readdirSync(templatesRoot())) {
    const raw = fs.readFileSync(path.join(templatesRoot(), file), 'utf8');
    const match = /^---\nto: <%= name %>\/(.+)\n---\n([\s\S]*)$/.exec(raw);
    if (!match) continue;
    const target = path.join(frontend, match[1]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, fill(match[2], vars, target));
  }
  // The app's own starter, router, typed-hooks placeholder, app.json and README on top.
  copyTree(overlayRoot(), dir, vars);

  const correlationId = randomUUID();
  fs.mkdirSync(path.join(frontend, '.tooljet'), { recursive: true });
  fs.writeFileSync(
    path.join(frontend, '.tooljet', 'config.json'),
    JSON.stringify({ libraryName: displayName, correlationId, includeSource: true }, null, 2) + '\n'
  );
  return { correlationId };
}
