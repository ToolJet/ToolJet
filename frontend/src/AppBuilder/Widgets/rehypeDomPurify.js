import DOMPurify from 'dompurify';
import { fromParse5 } from 'hast-util-from-parse5';
import { toParse5 } from 'hast-util-to-parse5';
import { parseFragment, serialize } from 'parse5';

// Runs after rehype-raw so Markdown-embedded HTML gets exactly the HTML format's DOMPurify policy, no stricter.
export const rehypeDomPurify = () => (tree) => fromParse5(parseFragment(DOMPurify.sanitize(serialize(toParse5(tree)))));
