/**
 * The viewer URL a compare frame loads. Values are encoded with encodeURIComponent, not
 * URLSearchParams: the viewer decodes %20 but reads + literally, so "Release 2" sent as
 * "Release+2" named a version that does not exist.
 */
export const previewFrameUrl = ({ subpath = '', app, pageKey, version, env, snapshot }) => {
  const query = [['version', version], ...(env ? [['env', env]] : []), ...(snapshot ? [['snapshot', snapshot]] : [])]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${subpath ?? ''}/applications/${encodeURIComponent(app)}/${encodeURIComponent(pageKey)}?${query}`;
};
