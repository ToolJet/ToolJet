import { useActiveVersion, useVersions } from '@docusaurus/plugin-content-docs/client';
import versionNames from '@site/versions.json';

// Pages write internal links without a version ("/docs/..."). That prefix is
// where the latest LTS is served; every other version lives below it
// ("/docs/beta/...", "/docs/3.5.0-LTS/...").
const DOCS_BASE = '/docs';

const stripTrailingSlash = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

// True when `href` is `base` itself or something below it, so that "/docs"
// does not match "/docs-archive".
const isUnder = (href, base) =>
  href === base || ['/', '#', '?'].some((separator) => href.startsWith(base + separator));

/**
 * The rewrite rule behind `useVersionedHref`, kept free of hooks.
 *
 * @param {string} href Link target as written by the author.
 * @param {string} [activeVersionPath] Path of the docs version being read, e.g. "/docs/beta".
 * @param {string[]} [versionPaths] Paths of all known docs versions.
 * @returns {string} `href`, moved under the active version when it is an unversioned docs link.
 */
export function toVersionedHref(href, activeVersionPath, versionPaths = []) {
  if (typeof href !== 'string' || !activeVersionPath) return href;

  const activePath = stripTrailingSlash(activeVersionPath);
  // The latest LTS is already what "/docs/..." points at. External links,
  // anchors, relative links and non-docs paths are never under DOCS_BASE.
  if (activePath === DOCS_BASE || !isUnder(href, DOCS_BASE)) return href;

  const pointsAtVersion = versionPaths.some((path) => {
    const versionPath = stripTrailingSlash(path);
    return versionPath !== DOCS_BASE && isUnder(href, versionPath);
  });
  return pointsAtVersion ? href : activePath + href.slice(DOCS_BASE.length);
}

/**
 * Keeps a reader inside the docs version they are reading.
 *
 * On a page of any version other than the latest LTS, "/docs/foo" becomes
 * "<that version's path>/foo" (for example "/docs/beta/foo"). Links that
 * already name a version, and everything that is not a docs path, are
 * returned unchanged.
 */
export default function useVersionedHref(href) {
  // `undefined` outside the docs routes (API reference, standalone pages).
  const activeVersion = useActiveVersion();
  const versions = useVersions();
  const versionPaths = [
    ...versions.map((version) => version.path),
    // `onlyIncludeVersions` can leave versions out of a build; versions.json
    // still names them, so links to them are recognised as versioned.
    ...versionNames.map((name) => `${DOCS_BASE}/${name}`),
  ];
  return toVersionedHref(href, activeVersion?.path, versionPaths);
}
