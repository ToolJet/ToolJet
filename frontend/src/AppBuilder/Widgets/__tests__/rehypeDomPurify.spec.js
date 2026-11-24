import DOMPurify from 'dompurify';
import { fromParse5 } from 'hast-util-from-parse5';
import { toParse5 } from 'hast-util-to-parse5';
import { parseFragment, serialize } from 'parse5';
import { rehypeDomPurify } from '../rehypeDomPurify';

// The tree rehype-raw hands on: the Markdown's own nodes with its embedded HTML already parsed.
const treeOf = (html) => fromParse5(parseFragment(html));
const run = (html) => serialize(toParse5(rehypeDomPurify()(treeOf(html))));

describe('Text: Markdown-embedded HTML gets the HTML format policy', () => {
  test('[Text-SEC-002] removes script, event-handler attributes and javascript: links', () => {
    const out = run(
      '<p>hi</p><script>window.__ran = 1</script><img src="x" onerror="window.__ran = 1">' +
        '<a href="javascript:window.__ran=1">link</a><iframe srcdoc="<b>x</b>"></iframe>'
    );

    expect(out).not.toMatch(/<script|onerror|javascript:|<iframe|srcdoc/i);
    expect(out).toContain('<p>hi</p>');
    expect(out).toContain('link');
  });

  test('[Text-SEC-002] keeps what the HTML format keeps: styles, classes, ids, data attributes, tables, svg and links', () => {
    const html =
      '<div class="note" id="n1" data-kind="x" style="color: red">styled</div>' +
      '<table><tbody><tr><td>cell</td></tr></tbody></table>' +
      '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>' +
      '<a href="https://example.com">site</a>';

    expect(run(html)).toBe(DOMPurify.sanitize(html));
  });

  test('[Text-SEC-002] matches the HTML format output for the same unsafe HTML', () => {
    const html =
      '<b onclick="window.__ran = 1">bold</b><style>p{}</style><a href="https://x.dev" target="_blank">t</a>';

    expect(run(html)).toBe(DOMPurify.sanitize(html));
  });
});
