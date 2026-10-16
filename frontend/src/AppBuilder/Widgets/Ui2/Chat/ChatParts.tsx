import React, { useEffect, useState } from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { formatTimestamp } from '@/AppBuilder/Widgets/Ui2/_shared/chatHelpers';
import { avatarHue } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import type { ReactNode } from 'react';
import type { RunRow } from './chatModel';

// ToolJet UI 2.0 Chat (Chat.tsx): its message rows, the typing dots, the loading skeleton and the header's buttons.

// The sample history's timestamps are the literal text 'new Date().toISOString()'. The native Chat formats the current
// time for them on every render, so a message's time changed as the clock passed a minute; here they read as the
// moment the pack loaded and stay put.
const NOW_LITERAL = 'new Date().toISOString()';
const LOADED_AT = new Date().toISOString();

const ChatAvatar = ({ src, name, size = 32 }: { src: string; name: string; size?: number }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = avatarHue(name);
  return (
    <span
      className="flex shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--sc-background))`,
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--sc-foreground))`,
      }}
      aria-hidden="true"
      data-fallback="initials"
    >
      {initials(name) || '?'}
    </span>
  );
};

// Markdown in replies (the native Chat's renderer: GitHub tables and lists, raw HTML), styled by .sc-markdown in
// shadcn.scss. Code blocks keep their language as a label.
const domProps = <P extends ExtraProps>({ node, ...rest }: P) => rest; // eslint-disable-line @typescript-eslint/no-unused-vars
const MD_COMPONENTS: Components = {
  a: (props) => <a {...domProps(props)} target="_blank" rel="noopener noreferrer" />,
  pre: (props) => <pre {...domProps(props)} className="sc-md-pre" />,
};
const Markdown = React.memo(({ content }: { content: string }) => (
  <div className="sc-markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>
      {content}
    </ReactMarkdown>
  </div>
));
Markdown.displayName = 'Markdown';

const CopyButton = ({ value, align }: { value: string; align: 'start' | 'end' }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy message'}
      title={copied ? 'Copied' : 'Copy'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          toast.error('Failed to copy message');
        }
      }}
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/msg:opacity-100 [&_svg]:size-3.5',
        align === 'end' ? 'ml-auto' : ''
      )}
    >
      {copied ? <Check /> : <Copy />}
    </button>
  );
};

interface MessageRowProps {
  row: RunRow;
  showAvatars: boolean;
  showTimestamps: boolean;
}

export const MessageRow = React.memo(({ row, showAvatars, showTimestamps }: MessageRowProps) => {
  const mine = row.type === 'message';
  const isError = row.type === 'error';
  const align = mine ? 'end' : 'start';
  return (
    <div
      className={cn(
        'group/msg flex w-full items-end gap-2.5',
        mine ? 'flex-row-reverse' : 'flex-row',
        row.first ? 'mt-4' : 'mt-1'
      )}
      data-message-key={row.key}
      data-type={row.type}
      data-align={align}
    >
      {showAvatars ? (
        <div className="mb-6 w-8 shrink-0">
          {row.last ? <ChatAvatar src={row.who.avatar} name={row.who.name} /> : null}
        </div>
      ) : null}
      <div className={cn('flex min-w-0 max-w-[82%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        {row.first ? (
          <div className={cn('flex items-baseline gap-2 px-1 text-xs', mine ? 'flex-row-reverse' : '')}>
            <span className="font-medium text-[color:var(--lk-name,var(--sc-foreground))]">{row.who.name}</span>
            {showTimestamps ? (
              <span className="tabular-nums text-[color:var(--lk-muted,var(--sc-muted-foreground))]">
                {formatTimestamp(row.timestamp === NOW_LITERAL ? LOADED_AT : row.timestamp)}
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          className={cn(
            'min-w-0 max-w-full break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
            mine &&
              'whitespace-pre-wrap rounded-br-md bg-[color:var(--lk-accent,var(--sc-primary))] text-[color:var(--sc-primary-foreground)]',
            !mine &&
              !isError &&
              'rounded-bl-md bg-[color:var(--lk-bubble,var(--sc-muted))] text-[color:var(--lk-fg,var(--sc-foreground))]',
            isError &&
              'flex items-start gap-2 rounded-bl-md border border-[color:color-mix(in_srgb,var(--sc-destructive)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--sc-destructive)_8%,transparent)] text-[color:var(--sc-destructive)]'
          )}
        >
          {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
          {mine || isError ? <span className="min-w-0">{row.text}</span> : <Markdown content={row.text} />}
        </div>
        <div className={cn('flex h-6 w-full px-0.5', mine ? 'justify-end' : 'justify-start')}>
          {row.text ? <CopyButton value={row.text} align={align} /> : null}
        </div>
      </div>
    </div>
  );
});
MessageRow.displayName = 'MessageRow';

export const Typing = ({ name, avatar, showAvatars }: { name: string; avatar: string; showAvatars: boolean }) => (
  <div className="mt-4 flex items-end gap-2.5" role="status" aria-label={`${name} is typing`}>
    {showAvatars ? (
      <div className="mb-1 w-8 shrink-0">
        <ChatAvatar src={avatar} name={name} />
      </div>
    ) : null}
    <div className="flex h-9 items-center gap-1 rounded-2xl rounded-bl-md bg-[color:var(--lk-bubble,var(--sc-muted))] px-4">
      {[0, 1, 2].map((i) => (
        <span key={i} className="sc-typing-dot" />
      ))}
    </div>
  </div>
);

export const HistorySkeleton = () => (
  <div className="flex flex-col gap-5 pt-4" aria-busy="true" aria-label="Loading messages">
    {[0, 1, 2].map((i) => (
      <div key={i} className={cn('flex items-end gap-2.5', i === 1 ? 'flex-row-reverse' : '')}>
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className={cn('flex flex-col gap-1.5', i === 1 ? 'items-end' : '')} style={{ width: '60%' }}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className={cn('h-14 w-full rounded-2xl')} />
        </div>
      </div>
    ))}
  </div>
);

export const IconButton = ({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4"
  >
    {children}
  </button>
);
