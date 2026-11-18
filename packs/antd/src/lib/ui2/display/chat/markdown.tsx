import React from 'react';
import type { ReactNode } from 'react';
import { safeUrl } from './values';

// A small Markdown renderer for chat replies. UI 2.0 renders replies with react-markdown (GitHub flavour, sanitised
// HTML); the pack has no Markdown dependency, so this covers what replies use: paragraphs, headings, lists, quotes,
// fenced code with its language, inline code, bold, italic, strike and links. It builds React elements, never HTML, so
// a reply cannot inject markup. Tables and raw HTML are drawn as text.

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(~~[^~]+~~)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/;

const inline = (text: string, key = 'i'): ReactNode[] => {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index) out.push(rest.slice(0, m.index));
    const token = m[0];
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<code key={k}>{token.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k}>{inline(token.slice(2, -2), k)}</strong>);
    else if (m[3]) out.push(<del key={k}>{inline(token.slice(2, -2), k)}</del>);
    else if (m[4]) out.push(<em key={k}>{inline(token.slice(1, -1), k)}</em>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token) ?? [];
      const url = safeUrl(href);
      out.push(
        url ? (
          <a key={k} href={url} target="_blank" rel="noopener noreferrer">
            {inline(label ?? '', k)}
          </a>
        ) : (
          token
        )
      );
    }
    rest = rest.slice(m.index + token.length);
  }
  return out;
};

const withBreaks = (lines: string[], key: string): ReactNode[] =>
  lines.flatMap((line, i) => (i ? [<br key={`${key}-br${i}`} />, ...inline(line, `${key}-${i}`)] : inline(line, `${key}-${i}`)));

export const Markdown = React.memo(({ content }: { content: string }) => {
  const lines = String(content ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    const fence = /^\s*```\s*([\w+-]*)/.exec(line);
    if (fence) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      i += 1;
      blocks.push(
        <pre key={key} className="ui2c-md-pre" data-lang={fence[1] || undefined}>
          {fence[1] ? <span className="ui2c-md-lang">{fence[1]}</span> : null}
          <code>{code.join('\n')}</code>
        </pre>
      );
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const Tag = `h${Math.min(6, heading[1].length + 2)}` as 'h3';
      blocks.push(<Tag key={key}>{inline(heading[2], key)}</Tag>);
      i += 1;
      continue;
    }
    const bullet = /^\s*([-*+]|\d+[.)])\s+/;
    if (bullet.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: string[] = [];
      while (i < lines.length && bullet.test(lines[i]) && /^\s*\d/.test(lines[i]) === ordered) items.push(lines[i++].replace(bullet, ''));
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List key={key}>
          {items.map((item, j) => (
            <li key={j}>{inline(item, `${key}-${j}`)}</li>
          ))}
        </List>
      );
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
      blocks.push(<blockquote key={key}>{withBreaks(quote, key)}</blockquote>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    blocks.push(<p key={key}>{withBreaks(para, key)}</p>);
  }
  return <div className="ui2c-markdown">{blocks}</div>;
});
Markdown.displayName = 'Markdown';
