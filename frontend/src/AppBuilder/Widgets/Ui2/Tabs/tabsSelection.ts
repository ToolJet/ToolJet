// The editor selection when a tab switches: a component inside the tab that went away gives way to the Tabs; any
// other selection (the Tabs itself, a widget outside it) stays. Clearing it on every switch flickered the inspector
// between Add new component and the Tabs' properties as the click selected the Tabs again.

type Definition = { component?: { parent?: string | null } } | undefined;
type SelectionStore = {
  selectedComponents?: string[];
  getComponentDefinition?: (id: string, moduleId: string) => Definition;
};

/** Whether the editor selection holds a component inside the Tabs `tabsId` (in any of its tabs, at any depth). */
export const selectionInsideTabs = (store: SelectionStore, tabsId: string, moduleId = 'canvas'): boolean => {
  const definition = (id: string) => store.getComponentDefinition?.(id, moduleId);
  // The component that owns a parent: the parent itself, or the widget whose sub-canvas it is (`<tabs id>-<tab id>`).
  const ownerOf = (parent: string) => {
    for (let owner = parent; owner; owner = owner.includes('-') ? owner.replace(/-[^-]*$/, '') : '') {
      if (definition(owner)) return owner;
    }
    return null;
  };
  const inside = (id: string) => {
    let parent = definition(id)?.component?.parent;
    for (let depth = 0; parent && depth < 20; depth++) {
      if (String(parent).startsWith(`${tabsId}-`)) return true;
      const owner = ownerOf(String(parent));
      parent = owner ? definition(owner)?.component?.parent : null;
    }
    return false;
  };
  return (store.selectedComponents ?? []).some((id) => id !== tabsId && inside(id));
};
