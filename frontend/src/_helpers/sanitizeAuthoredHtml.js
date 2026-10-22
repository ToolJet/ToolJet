import createDOMPurify from 'dompurify';

/**
 * Sanitize the HTML component's authored markup, with its link handling attached.
 *
 * The link rewrite runs on a DEDICATED DOMPurify instance. `addHook` registers on whichever
 * instance it is called on, and the default export is shared by every caller in the app — Text,
 * tooltips, SvgImage, the markdown and HTML renderers — so hooking the default export rewrote
 * their anchors too. It was also registered on each mount and never removed, so the hooks stacked.
 */
const purify = createDOMPurify(window);

purify.addHook('afterSanitizeAttributes', (node) => {
  // Only links. The previous hook keyed off `'target' in node`, which also matches elements like
  // <form>, and forcing those into a new tab was never the intent.
  if (!node.hasAttribute?.('href')) return;

  const href = node.getAttribute('href') || '';

  // An in-page link has to stay in this tab. Sent to a new tab it reloads the app at `#id`
  // instead of scrolling to the heading the author is pointing at.
  if (href.startsWith('#')) return;

  // An explicit target is the author's decision, including `_self`. It only reaches this hook
  // because `target` is allowed through below — DOMPurify drops it by default, which is why the
  // previous code could not tell "the author chose _self" from "the author chose nothing".
  if (!node.hasAttribute('target')) node.setAttribute('target', '_blank');

  // `_blank` AND any named target open a new browsing context, and a named one keeps
  // `window.opener` pointing back at the app — browsers only imply `noopener` for `_blank`. That
  // lets an untrusted destination navigate the opener. Only the keywords that stay in an existing
  // context are exempt. Nothing is lost against the old behaviour: the previous hook rewrote every
  // target to `_blank`, so a named window was never reusable here in the first place.
  const target = node.getAttribute('target');
  if (target && !['_self', '_parent', '_top'].includes(target)) {
    // Add to the author's `rel` rather than replacing it: overwriting silently dropped tokens
    // they set deliberately, such as `nofollow` and `noreferrer`.
    const tokens = new Set((node.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    tokens.add('noopener');
    node.setAttribute('rel', [...tokens].join(' '));
  }
});

/**
 * @param {string} rawHtml authored markup
 * @returns {string} sanitized markup with link targets resolved
 */
export const sanitizeAuthoredHtml = (rawHtml) =>
  // ADD_ATTR keeps the author's own `target` — DOMPurify strips it by default to blunt
  // tabnabbing, which the `noopener` added above covers for the only value that needs it.
  purify.sanitize(rawHtml, { FORCE_BODY: true, ADD_ATTR: ['target'] });
