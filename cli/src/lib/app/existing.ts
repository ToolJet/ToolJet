/* Reading an existing app's code page (clone). */

export const findCodeRoot = (pages: any[]): { page: any; component: any } | null => {
  for (const page of pages) {
    for (const entry of Object.values(page.components ?? {}) as any[]) {
      const c = entry?.component;
      const flag = c?.definition?.properties?.codePage?.value;
      if (
        c &&
        !c.parent &&
        (c.component === 'LibraryComponent' || c.component === 'PackComponent') &&
        (flag === true || flag === '{{true}}')
      ) {
        return { page, component: c };
      }
    }
  }
  return null;
};

export const parseRegistry = (component: any): { id: string; path: string; title?: string; pageId?: string }[] => {
  try {
    const parsed = JSON.parse(component?.definition?.properties?.routes?.value ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((r) => r && typeof r.id === 'string' && typeof r.path === 'string')
      : [];
  } catch {
    return [];
  }
};
