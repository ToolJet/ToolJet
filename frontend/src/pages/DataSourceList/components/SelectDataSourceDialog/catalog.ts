import {
  AiSources,
  ApiSources,
  CloudStorageSources,
  DataBaseSources,
  getCommonlyUsedDataSources,
} from '@/modules/common/components/DataSourceComponents';
import { getDataSourceGroupLabel } from '@/modules/dataSources/components/GlobalDataSources/utils';

export type SectionId = 'popular' | 'databases' | 'apis' | 'plugins' | 'cloud-storage' | 'ai';

/** A built-in manifest source or an installed plugin, as the old data sources page consumed them. */
export interface CatalogSource {
  id?: string;
  name: string;
  kind: string;
  iconFile?: { data?: string };
  description?: string;
  /** Present on installed plugins: the manifest stored when the plugin was installed. */
  manifestFile?: { data?: Record<string, { description?: string } | undefined> };
  [key: string]: unknown;
}

export interface CatalogItem {
  key: string;
  name: string;
  kind: string;
  /** Base64 SVG of an installed plugin's logo; built-ins resolve their icon from `kind`. */
  iconData?: string;
  description?: string;
  source: CatalogSource;
}

export interface CatalogSection {
  id: SectionId;
  label: string;
  items: CatalogItem[];
}

// Same order as the filter pills, so scrolling down the list walks the pills left to right.
const SECTION_LABELS: Record<SectionId, string> = {
  popular: 'Popular',
  databases: 'Databases',
  apis: "API's",
  plugins: 'Plugins',
  'cloud-storage': 'Cloud storage',
  ai: 'AI',
};

// A plugin row's own `description` is the marketplace listing text, so plugins read only their manifest.
const getCardDescription = (source: CatalogSource): string | undefined => {
  if (!source.manifestFile) return source.description;
  const manifest = source.manifestFile.data;
  return manifest?.['tj:source']?.description ?? manifest?.source?.description;
};

const sortByName = (sources: CatalogSource[]) =>
  [...sources].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

const toItem = (source: CatalogSource, sectionId: SectionId): CatalogItem => ({
  key: `${sectionId}:${source.id ?? source.kind}`,
  name: source.name,
  kind: source.kind,
  iconData: source.iconFile?.data,
  description: getCardDescription(source),
  source,
});

interface BuildCatalogOptions {
  /** Plugins are marketplace-installed, so cloud has none. */
  includePlugins: boolean;
}

export function buildCatalogSections(
  installedPlugins: CatalogSource[],
  { includePlugins }: BuildCatalogOptions
): CatalogSection[] {
  const pluginsByGroup = installedPlugins.reduce<Record<string, CatalogSource[]>>((acc, plugin) => {
    const group = getDataSourceGroupLabel(plugin);
    (acc[group] ||= []).push(plugin);
    return acc;
  }, {});

  const builtIns: Record<Exclude<SectionId, 'popular' | 'plugins'>, CatalogSource[]> = {
    databases: DataBaseSources,
    apis: ApiSources,
    'cloud-storage': CloudStorageSources,
    ai: AiSources,
  };

  const sourcesBySection: Record<SectionId, CatalogSource[]> = {
    popular: getCommonlyUsedDataSources(installedPlugins),
    databases: sortByName([...builtIns.databases, ...(pluginsByGroup.Databases || [])]),
    apis: sortByName([...builtIns.apis, ...(pluginsByGroup.APIs || [])]),
    plugins: sortByName(pluginsByGroup.Plugins || []),
    'cloud-storage': sortByName([...builtIns['cloud-storage'], ...(pluginsByGroup['Cloud Storages'] || [])]),
    ai: sortByName([...builtIns.ai, ...(pluginsByGroup.AI || [])]),
  };

  return (Object.keys(SECTION_LABELS) as SectionId[])
    .filter((id) => includePlugins || id !== 'plugins')
    .map((id) => ({ id, label: SECTION_LABELS[id], items: sourcesBySection[id].map((source) => toItem(source, id)) }));
}

/** Keeps matching cards per section and drops the sections left empty. */
export function filterSections(sections: CatalogSection[], query: string): CatalogSection[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return sections;

  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => item.name.toLowerCase().includes(needle)) }))
    .filter((section) => section.items.length > 0);
}
