import * as fs from 'fs';
import * as path from 'path';
import { ExportedAppVersion, readAppVersionsFromExport } from '@modules/app-validation/export-reader';

const TEMPLATES_DIR = path.resolve(__dirname, '../../../../templates');

let cached: ExportedAppVersion[] | undefined;

// ToolJet ships these templates, so a rule that fires on them is wrong, not the app.
export function templateAppVersions(): ExportedAppVersion[] {
  if (!cached) {
    cached = fs
      .readdirSync(TEMPLATES_DIR)
      .map((dir) => path.join(TEMPLATES_DIR, dir, 'definition.json'))
      .filter((file) => fs.existsSync(file))
      .flatMap((file) => readAppVersionsFromExport(JSON.parse(fs.readFileSync(file, 'utf8'))));
  }
  return cached;
}
