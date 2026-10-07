import { readdirSync, readFileSync } from 'fs';

function getTemplateManifests() {
  const directories = readdirSync('./templates', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // readdirSync order depends on the filesystem, so sort for the same template order everywhere
  return directories
    .map((directory) => JSON.parse(readFileSync(`templates/${directory}/manifest.json`, 'utf-8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const TemplateAppManifests = getTemplateManifests();
