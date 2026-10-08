// Manifest rules for the template gallery. Pure; scripts/generate-template-assets.ts applies them to every template.

// Only the parts of definition.json the manifest rules read
export interface TemplateDefinition {
  app: Array<{
    definition: {
      appV2: {
        dataSources?: Array<{ id: string; kind: string }>;
        dataQueries?: Array<{ dataSourceId: string }>;
      };
    };
  }>;
}

export interface TemplateSource {
  id: string;
  name: string;
}

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  category: string;
  features?: string[];
  sources: TemplateSource[];
  widgets?: string[];
}

// App names are capped at 100 characters; this leaves room for the "_N" a repeated create appends
export const MAX_TEMPLATE_NAME_LENGTH = 90;

const BUILT_IN_SOURCE_NAMES: Record<string, string> = {
  tooljetdb: 'ToolJet Database',
  runjs: 'Run JavaScript',
  runpy: 'Run Python',
  restapi: 'REST API',
  workflows: 'Workflows',
};

export function deriveSources(
  definition: TemplateDefinition,
  pluginName: (kind: string) => string | undefined
): TemplateSource[] {
  const kinds = new Set<string>();
  for (const { definition: appDefinition } of definition.app) {
    const kindById = new Map((appDefinition.appV2.dataSources ?? []).map((ds) => [ds.id, ds.kind]));
    for (const query of appDefinition.appV2.dataQueries ?? []) {
      const kind = kindById.get(query.dataSourceId);
      if (kind) kinds.add(kind);
    }
  }

  return [...kinds].sort().map((kind) => {
    const name = BUILT_IN_SOURCE_NAMES[kind] ?? pluginName(kind);
    if (!name)
      throw new Error(`Unknown data source kind "${kind}": add it to BUILT_IN_SOURCE_NAMES or plugins/packages`);
    return { id: kind, name };
  });
}

const isBlank = (value: unknown) => typeof value !== 'string' || !value.trim();

export function validateManifest(
  folder: string,
  manifest: TemplateManifest,
  categories: Record<string, string>,
  previewExists: boolean
): string[] {
  const errors: string[] = [];
  for (const field of ['id', 'name', 'description', 'category'] as const) {
    if (isBlank(manifest[field])) errors.push(`${field} is required`);
  }
  if (manifest.id && manifest.id !== folder) errors.push(`id "${manifest.id}" must equal the folder name`);
  if (manifest.category && !categories[manifest.category])
    errors.push(`category "${manifest.category}" is not in categories.json`);
  if (manifest.name?.length > MAX_TEMPLATE_NAME_LENGTH)
    errors.push(`name is longer than ${MAX_TEMPLATE_NAME_LENGTH} characters`);
  if (
    manifest.features !== undefined &&
    (!Array.isArray(manifest.features) || manifest.features.some((feature) => typeof feature !== 'string'))
  )
    errors.push('features must be an array of strings');
  if (!previewExists) errors.push(`preview ${folder}.html is missing`);
  return errors;
}
