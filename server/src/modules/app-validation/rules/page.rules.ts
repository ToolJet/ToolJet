import { PAGE_HANDLE_PATTERN } from '../catalog';
import { PageWrite, Rule, RuleContext, Severity, WriteSource } from '../types';
import { isLiterallyTrue } from '../core/values';

// The editor's validateKebabCase (frontend/src/_helpers/utils.js): the handle is the URL
// path segment of the page, so it stays kebab-case.
export { PAGE_HANDLE_PATTERN };

// ToolJet's own templates ship pages whose handle is the raw name ("Product Inventory"
// in the inventory-management and supply-chain templates), and the viewer still routes
// them via percent-encoding - so reproducing stored data only warns, while interactive
// writes that create such a handle block.
const BULK_SOURCES: ReadonlySet<WriteSource> = new Set(['import', 'git', 'copy', 'restore']);

function referenceSeverity(source: WriteSource): Severity {
  return BULK_SOURCES.has(source) ? 'medium' : 'high';
}

function labelOf(write: PageWrite): string {
  return write.data?.name ?? write.data?.handle ?? write.id;
}

function touchedField(write: PageWrite, field: string): boolean {
  if (write.op !== 'update' || !write.touched) return true;
  return write.touched.includes(field);
}

// CreatePageDto has no pattern and no @IsNotEmpty on handle, and updatePage writes the raw
// diff; a handle with spaces or slashes breaks the page URL.
export const pageHandleFormat: Rule<PageWrite> = {
  id: 'page-handle-format',
  description: 'The page handle is a valid URL segment',
  check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !touchedField(write, 'handle')) return [];
    if (write.op === 'update' && write.data?.handle === undefined) return [];
    const handle = write.data?.handle;
    if (typeof handle === 'string' && PAGE_HANDLE_PATTERN.test(handle)) return [];
    return [
      {
        code: 'PAGE_HANDLE_INVALID',
        severity: referenceSeverity(ctx.source),
        confidence: 'certain',
        path: `${labelOf(write)}.handle`,
        message:
          handle === undefined || handle === ''
            ? `${labelOf(write)}, handle: no handle set, the page has no URL`
            : `${labelOf(write)}, handle: "${handle}" is not kebab-case (letters and digits separated by single hyphens)`,
        entity: { type: 'page', id: write.id, name: write.data?.name },
        fix: 'Use a kebab-case handle, e.g. "order-details".',
      },
    ];
  },
};

// The handle is the page's URL: two pages sharing one handle make the second unreachable.
// Run inside the save transaction after lockForValidation(manager, 'page_handle', versionId).
export const pageHandleUnique: Rule<PageWrite> = {
  id: 'page-handle-unique',
  description: 'The page handle is unique in the app version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.handle || !touchedField(write, 'handle')) return [];
    const index = await ctx.index();
    const clash = index.pages().find((page) => page.id !== write.id && page.handle === write.data?.handle);
    if (!clash) return [];
    return [
      {
        code: 'PAGE_HANDLE_TAKEN',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.handle`,
        message: `${labelOf(write)}, handle: "${write.data.handle}" is already the URL of page ${clash.name ?? clash.id} in this app version`,
        entity: { type: 'page', id: write.id, name: write.data?.name },
      },
    ];
  },
};

// Pages are referenced by id, so a duplicate name breaks nothing at runtime - it only
// makes the page list ambiguous for builders. Warns, never blocks.
export const pageNameUnique: Rule<PageWrite> = {
  id: 'page-name-unique',
  description: 'The page name is unique in the app version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.name || !touchedField(write, 'name')) return [];
    const index = await ctx.index();
    const clash = index.pages().find((page) => page.id !== write.id && page.name === write.data?.name);
    if (!clash) return [];
    return [
      {
        code: 'PAGE_NAME_TAKEN',
        severity: 'medium',
        confidence: 'certain',
        path: `${labelOf(write)}.name`,
        message: `${labelOf(write)}, name: another page in this app version is already named "${write.data.name}"`,
        entity: { type: 'page', id: write.id, name: write.data.name },
      },
    ];
  },
};

// updatePage, deletePage and reorderPages look pages up by id alone, so a request can
// touch a page of another version (or another tenant's app). Scoped to the version here.
export const pageInVersion: Rule<PageWrite> = {
  id: 'page-in-version',
  description: 'The page being changed belongs to this app version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'create') return [];
    const index = await ctx.index();
    if (index.page(write.id)) return [];
    return [
      {
        code: 'PAGE_NOT_IN_VERSION',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.id`,
        message: `${labelOf(write)}, id: no page with id ${write.id} exists in this app version`,
        entity: { type: 'page', id: write.id },
      },
    ];
  },
};

// deletePage protects the home page but deletePageWithManager does not, nothing protects
// the last page server-side, and deleting a group with its children can take the home
// page down with it. An app without a home page (or without pages) cannot open.
export const pageDeleteSafe: Rule<PageWrite> = {
  id: 'page-delete-safe',
  description: 'The delete leaves the app with its home page and at least one page',
  async check(write, ctx: RuleContext) {
    if (write.op !== 'delete') return [];
    const index = await ctx.index();
    const page = index.page(write.id);
    if (!page) return []; // reported by page-in-version

    if (page.id === index.homePageId) {
      return [
        {
          code: 'PAGE_HOME_DELETE',
          severity: 'high',
          confidence: 'certain',
          path: `${labelOf(write)}.id`,
          message: `${labelOf(write)}: this is the home page, deleting it leaves the app with no page to open`,
          entity: { type: 'page', id: write.id, name: page.name },
          fix: 'Mark another page as home first.',
        },
      ];
    }

    if (page.isPageGroup && write.data?.deleteAssociatedPages) {
      const children = index.pages().filter((p) => p.pageGroupId === page.id);
      const home = children.find((child) => child.id === index.homePageId);
      if (home) {
        return [
          {
            code: 'PAGE_GROUP_CONTAINS_HOME',
            severity: 'high',
            confidence: 'certain',
            path: `${labelOf(write)}.id`,
            message: `${labelOf(write)}: deleting this group also deletes ${home.name ?? home.id}, the home page`,
            entity: { type: 'page', id: write.id, name: page.name },
            fix: 'Move the home page out of the group, or delete the group without its pages.',
          },
        ];
      }
    }

    if (!page.isPageGroup) {
      const remaining = index.pages().filter((p) => !p.isPageGroup && p.id !== page.id);
      if (remaining.length === 0) {
        return [
          {
            code: 'PAGE_LAST_DELETE',
            severity: 'high',
            confidence: 'certain',
            path: `${labelOf(write)}.id`,
            message: `${labelOf(write)}: this is the only page, deleting it leaves the app empty`,
            entity: { type: 'page', id: write.id, name: page.name },
          },
        ];
      }
    }
    return [];
  },
};

// A module renders inside a host app as a single surface; the editor hides page
// management for modules, so a second page row is unreachable data.
export const pageModuleSinglePage: Rule<PageWrite> = {
  id: 'page-module-single-page',
  description: 'A module has exactly one page',
  async check(write, ctx: RuleContext) {
    if (write.op !== 'create') return [];
    const index = await ctx.index();
    const isModule = ctx.appType === 'module' || index.hasComponentOfType('ModuleContainer');
    if (!isModule) return [];
    const others = index.pages().filter((page) => page.id !== write.id);
    if (others.length === 0) return [];
    return [
      {
        code: 'PAGE_MODULE_EXTRA',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.id`,
        message: `${labelOf(write)}: a module has exactly one page and this version already has one`,
        entity: { type: 'page', id: write.id, name: write.data?.name },
      },
    ];
  },
};

// Hiding or disabling the home page strands the app's entry point. `hidden` is an fx-able
// jsonb value, so only a literal true is judged - dynamic expressions pass.
export const pageHomeStaysVisible: Rule<PageWrite> = {
  id: 'page-home-stays-visible',
  description: 'The home page is not hidden or disabled',
  async check(write, ctx: RuleContext) {
    if (write.op !== 'update' || !write.data) return [];
    const index = await ctx.index();
    if (write.id !== index.homePageId) return [];

    if (touchedField(write, 'hidden') && isLiterallyTrue(write.data.hidden)) {
      return [
        {
          code: 'PAGE_HOME_HIDDEN',
          severity: 'high',
          confidence: 'certain',
          path: `${labelOf(write)}.hidden`,
          message: `${labelOf(write)}, hidden: this is the home page, hiding it strands the app's entry point`,
          entity: { type: 'page', id: write.id, name: write.data.name },
          fix: 'Mark another page as home first.',
        },
      ];
    }
    if (touchedField(write, 'disabled') && (write.data.disabled === true || isLiterallyTrue(write.data.disabled))) {
      return [
        {
          code: 'PAGE_HOME_DISABLED',
          severity: 'high',
          confidence: 'certain',
          path: `${labelOf(write)}.disabled`,
          message: `${labelOf(write)}, disabled: this is the home page, disabling it strands the app's entry point`,
          entity: { type: 'page', id: write.id, name: write.data.name },
          fix: 'Mark another page as home first.',
        },
      ];
    }
    return [];
  },
};

export const pageRules: Rule<PageWrite>[] = [
  pageHandleFormat,
  pageHandleUnique,
  pageNameUnique,
  pageInVersion,
  pageDeleteSafe,
  pageModuleSinglePage,
  pageHomeStaysVisible,
];
