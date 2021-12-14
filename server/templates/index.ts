import { readdirSync, readFileSync } from 'fs';

function getTemplateManifests() {
  const directories = readdirSync('./templates', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  return directories.map((directory) => JSON.parse(readFileSync(`templates/${directory}/manifest.json`, 'utf-8')));
}

export const TemplateAppManifests = getTemplateManifests();
