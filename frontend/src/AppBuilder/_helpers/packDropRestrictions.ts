import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';
import type { LibraryManifest, ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';

/**
 * The ToolJet widget a component pack's widget stands for in the drop rules (RESTRICTED_WIDGETS_CONFIG), read from
 * its manifest role. Every pack widget has the one type PackComponent, so without this no rule applied to them: a
 * Kanban dropped into a pack Kanban card, a Calendar into a pack Dialog (QA item 23).
 *
 * Roles that are also plain widgets (a Tabs strip, an Accordion of text) stand for the container only when the
 * component has slots, so a slot-less one goes anywhere, as before.
 */
const ROLE_TYPES: Record<string, string> = {
  kanban: 'Kanban',
  calendar: 'Calendar',
  listview: 'Listview',
  table: 'Table',
  form: 'Form',
};
const CONTAINER_ROLE_TYPES: Record<string, string> = {
  tabs: 'Tabs',
  accordion: 'Accordion',
  'accordion-container': 'Accordion',
  card: 'Container',
  'split-pane': 'Container',
  stepper: 'Container',
  dialog: 'ModalV2',
  drawer: 'ModalV2',
};

interface WidgetComponent {
  component?: string;
  definition?: { properties?: Record<string, { value?: unknown } | undefined> };
}

const packManifestEntry = (component: WidgetComponent | undefined): ManifestComponent | undefined => {
  if (component?.component !== 'PackComponent') return undefined;
  const properties = component.definition?.properties ?? {};
  const pack = properties.pack?.value;
  const name = properties.componentName?.value;
  if (typeof pack !== 'string' || typeof name !== 'string') return undefined;
  const manifests: Record<string, LibraryManifest> = useBuiltinPacksStore.getState().manifests;
  return manifests[pack]?.components?.[name];
};

const packStandsFor = (component: WidgetComponent | undefined): string | undefined => {
  const entry = packManifestEntry(component);
  const role = entry?.role;
  if (!role) return undefined;
  return ROLE_TYPES[role] ?? (entry.slots?.length ? CONTAINER_ROLE_TYPES[role] : undefined);
};

/** The widget type the drop rules check for a dragged, pasted or newly added widget. */
export const restrictedTypeOf = (component: WidgetComponent | undefined): string | undefined =>
  packStandsFor(component) ?? component?.component;

/**
 * The RESTRICTED_WIDGETS_CONFIG entry for a pack widget's slots (a pack Kanban's cards are a Kanban_card), or
 * undefined for any other widget, whose own rules are unchanged.
 */
export const packSlotRestrictionType = (component: WidgetComponent | undefined): string | undefined => {
  const type = packStandsFor(component);
  return type === 'Kanban' ? 'Kanban_card' : type;
};
