import { readdirSync, readFileSync } from 'fs';

function getTemplates() {
  const directories = readdirSync('./templates', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let templateAppDefinitions = {};
  let templateAppManifests = []

  for (const directory of directories) {
    const definition = JSON.parse(readFileSync(`templates/${directory}/definition.json`, 'utf-8'))
    const manifest = JSON.parse(readFileSync(`templates/${directory}/manifest.json`, 'utf-8'))

    templateAppDefinitions = {[manifest.id]: definition, ...templateAppDefinitions}
    templateAppManifests = [manifest, ...templateAppManifests]
  }

  return {templateAppDefinitions, templateAppManifests}
}

const {templateAppDefinitions, templateAppManifests} =  getTemplates()

export const TemplateAppDefinitions = templateAppDefinitions;
export const TemplateAppManifests = templateAppManifests;
