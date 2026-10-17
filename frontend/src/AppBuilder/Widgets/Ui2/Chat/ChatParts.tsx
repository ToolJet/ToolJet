import React, { useEffect, useState } from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { formatTimestamp } from '@/AppBuilder/Widgets/Ui2/_shared/chatHelpers';
import { avatarHue } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import type { ReactNode } from 'react';
import type { RunRow } from './chatModel';
import { useCopied } from '@/AppBuilder/Widgets/Ui2/_shared/useCopied';

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
        className="tw-shrink-0 tw-rounded-full tw-object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = avatarHue(name);
  return (
    <span
      className="tw-flex tw-shrink-0 tw-select-none tw-items-center tw-justify-center tw-rounded-full tw-text-xs tw-font-semibold"
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
  const [copied, markCopied] = useCopied();
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy message'}
      title={copied ? 'Copied' : 'Copy'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          markCopied();
        } catch {
          toast.error('Failed to copy message');
        }
      }}
      className={cn(
        'tw-inline-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-ui2-md tw-text-ui2-muted-foreground tw-opacity-0 tw-transition-opacity tw-duration-150 hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground focus-visible:tw-opacity-100 group-hover/msg:tw-opacity-100 [&_svg]:tw-size-3.5',
        align === 'end' ? 'tw-ml-auto' : ''
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
        'group/msg tw-flex tw-w-full tw-items-end tw-gap-2.5',
        mine ? 'tw-flex-row-reverse' : 'tw-flex-row',
        row.first ? 'tw-mt-4' : 'tw-mt-1'
      )}
      data-message-key={row.key}
      data-type={row.type}
      data-align={align}
    >
      {showAvatars ? (
        <div className="tw-mb-6 tw-w-8 tw-shrink-0">
          {row.last ? <ChatAvatar src={row.who.avatar} name={row.who.name} /> : null}
        </div>
      ) : null}
      <div
        className={cn(
          'tw-flex tw-min-w-0 tw-max-w-[82%] tw-flex-col tw-gap-1',
          mine ? 'tw-items-end' : 'tw-items-start'
        )}
      >
        {row.first ? (
          <div
            className={cn('tw-flex tw-items-baseline tw-gap-2 tw-px-1 tw-text-xs', mine ? 'tw-flex-row-reverse' : '')}
          >
            <span className="tw-font-medium tw-text-[color:var(--lk-name,var(--sc-foreground))]">{row.who.name}</span>
            {showTimestamps ? (
              <span className="tw-tabular-nums tw-text-[color:var(--lk-muted,var(--sc-muted-foreground))]">
                {formatTimestamp(row.timestamp === NOW_LITERAL ? LOADED_AT : row.timestamp)}
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          className={cn(
            'tw-min-w-0 tw-max-w-full tw-break-words tw-rounded-2xl tw-px-3.5 tw-py-2 tw-text-ui2-sm tw-leading-relaxed',
            mine &&
              'tw-whitespace-pre-wrap tw-rounded-br-ui2-md tw-bg-[color:var(--lk-accent,var(--sc-primary))] tw-text-[color:var(--sc-primary-foreground)]',
            !mine &&
              !isError &&
              'tw-rounded-bl-ui2-md tw-bg-[color:var(--lk-bubble,var(--sc-muted))] tw-text-[color:var(--lk-fg,var(--sc-foreground))]',
            isError &&
              'tw-flex tw-items-start tw-gap-2 tw-rounded-bl-ui2-md tw-border tw-border-[color:color-mix(in_srgb,var(--sc-destructive)_35%,transparent)] tw-bg-[color:color-mix(in_srgb,var(--sc-destructive)_8%,transparent)] tw-text-[color:var(--sc-destructive)]'
          )}
        >
          {isError ? <AlertCircle className="tw-mt-0.5 tw-h-4 tw-w-4 tw-shrink-0" aria-hidden="true" /> : null}
          {mine || isError ? <span className="tw-min-w-0">{row.text}</span> : <Markdown content={row.text} />}
        </div>
        <div className={cn('tw-flex tw-h-6 tw-w-full tw-px-0.5', mine ? 'tw-justify-end' : 'tw-justify-start')}>
          {row.text ? <CopyButton value={row.text} align={align} /> : null}
        </div>
      </div>
    </div>
  );
});
MessageRow.displayName = 'MessageRow';

export const Typing = ({ name, avatar, showAvatars }: { name: string; avatar: string; showAvatars: boolean }) => (
  <div className="tw-mt-4 tw-flex tw-items-end tw-gap-2.5" role="status" aria-label={`${name} is typing`}>
    {showAvatars ? (
      <div className="tw-mb-1 tw-w-8 tw-shrink-0">
        <ChatAvatar src={avatar} name={name} />
      </div>
    ) : null}
    <div className="tw-flex tw-h-9 tw-items-center tw-gap-1 tw-rounded-2xl tw-rounded-bl-ui2-md tw-bg-[color:var(--lk-bubble,var(--sc-muted))] tw-px-4">
      {[0, 1, 2].map((i) => (
        <span key={i} className="sc-typing-dot" />
      ))}
    </div>
  </div>
);

export const HistorySkeleton = () => (
  <div className="tw-flex tw-flex-col tw-gap-5 tw-pt-4" aria-busy="true" aria-label="Loading messages">
    {[0, 1, 2].map((i) => (
      <div key={i} className={cn('tw-flex tw-items-end tw-gap-2.5', i === 1 ? 'tw-flex-row-reverse' : '')}>
        <Skeleton className="tw-h-8 tw-w-8 tw-shrink-0 tw-rounded-full" />
        <div className={cn('tw-flex tw-flex-col tw-gap-1.5', i === 1 ? 'tw-items-end' : '')} style={{ width: '60%' }}>
          <Skeleton className="tw-h-3 tw-w-20" />
          <Skeleton className={cn('tw-h-14 tw-w-full tw-rounded-2xl')} />
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
    className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-ui2-md tw-text-ui2-muted-foreground tw-transition-colors hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-pointer-events-none disabled:tw-opacity-50 [&_svg]:tw-size-4"
  >
    {children}
  </button>
);
