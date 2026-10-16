import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle, ArrowDown, ArrowUp, Check, Copy, Download, MessageSquare, Trash2 } from 'lucide-react';
import { Shell, busy } from './Shadcn';
import { initials, useExposed } from '../packHooks';
import { Skeleton, cn } from './ui';
import { truthy, useOverrides } from './parity';
import {
  ANCHOR_PEEK,
  MESSAGES_PER_STEP,
  anchorTarget,
  buildMessage,
  isNearBottom,
  sender,
  spacerHeight,
  toRows,
  withRuns,
} from './chatModel';
import { formatTimestamp, validateMessageHistory, validateSingleMessageObject } from '../Chat/utils/helpers';

// The sample history's timestamps are the literal text 'new Date().toISOString()'. The native Chat formats the current
// time for them on every render, so a message's time changed as the clock passed a minute; here they read as the
// moment the pack loaded and stay put.
const NOW_LITERAL = 'new Date().toISOString()';
const LOADED_AT = new Date().toISOString();
import { avatarHue } from '../NewTable/_utils/avatarHue';
import { stringify } from '../packJson';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// ToolJet UI 2.0 Chat: the native Chat widget (Widgets/Chat) in the pack's look, with its properties, events, exposed
// values and actions. Config in WidgetManager/widgets/shad*.js, message and scroll logic in chatModel.js,
// style variables in looks/conversation.js. Scrolling follows shadcn's Message Scroller: the view follows new content
// only while the reader is at the end; a new user turn moves near the top with its reply growing below it; scrolled
// up, nothing moves the reader and a Jump to latest button brings them back.

const ChatAvatar = ({ src, name, size = 32 }) => {
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
const domProps = ({ node, ...rest }) => rest; // eslint-disable-line no-unused-vars
const MD_COMPONENTS = {
  a: (props) => <a {...domProps(props)} target="_blank" rel="noopener noreferrer" />,
  pre: (props) => <pre {...domProps(props)} className="sc-md-pre" />,
};
const Markdown = React.memo(({ content }) => (
  <div className="sc-markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>
      {content}
    </ReactMarkdown>
  </div>
));
Markdown.displayName = 'Markdown';

const CopyButton = ({ value, align }) => {
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

const MessageRow = React.memo(({ row, showAvatars, showTimestamps }) => {
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

const Typing = ({ name, avatar, showAvatars }) => (
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

const HistorySkeleton = () => (
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

const IconButton = ({ label, onClick, disabled, children }) => (
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

const MAX_INPUT_HEIGHT = 160;

export const ShadChat = (props) => {
  const { properties: raw, setExposedVariables, fireEvent, id } = props;
  const [p, override] = useOverrides(raw);
  const people = {
    userName: p.userName,
    userAvatar: p.userAvatar,
    respondentName: p.respondentName,
    respondentAvatar: p.respondentAvatar,
  };
  const peopleRef = useRef(people);
  peopleRef.current = people;

  const initial = useMemo(
    () => (Array.isArray(p.initialChat) ? p.initialChat : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stringify(p.initialChat ?? null)]
  );
  const [history, setHistory] = useState(initial);
  const historyRef = useRef(history);
  historyRef.current = history;
  const [last, setLast] = useState({ lastMessage: {}, lastResponse: {} });
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');

  // A new initialChat (an inspector edit, a binding that loaded) replaces the history, as the native Chat does.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setHistory(initial);
    setError(null);
  }, [initial]);

  const historyLoading = !!p.loadingHistory;
  const responseLoading = !!p.loadingResponse;
  const inputDisabled = !!p.disableInput;
  const locked = inputDisabled || busy(p);

  const commit = useCallback(
    (next, lastValues) => {
      historyRef.current = next;
      setHistory(next);
      setError(null);
      if (lastValues) setLast((l) => ({ ...l, ...lastValues }));
      setExposedVariables({ history: next, ...(lastValues || {}) });
    },
    [setExposedVariables]
  );

  // Set by a send or an appendHistory, so the next layout pass knows rows were added by a turn: a history that
  // grew any other way (a bound initialChat that loaded after an empty first draw, a refreshed query) is a load,
  // which opens at the end instead of lifting the last user message to the top.
  const appended = useRef(false);

  const send = (messageObject, shouldFire) => {
    const message = buildMessage(messageObject, peopleRef.current, uuidv4());
    appended.current = true;
    commit([...historyRef.current, message], { lastMessage: message });
    if (shouldFire) fireEvent('onMessageSent');
  };

  const clearHistory = (shouldFire) => {
    commit(initial, { lastMessage: {}, lastResponse: {} });
    if (shouldFire) fireEvent('onClearHistory');
  };

  const download = () => {
    try {
      const list = historyRef.current;
      if (!Array.isArray(list) || list.length === 0) {
        toast.error('No chat history available to download.');
        return;
      }
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-history-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Chat history downloaded successfully');
    } catch {
      toast.error('Failed to download chat history');
    }
  };

  // The native Chat's actions. sendMessage adds a message without firing onMessageSent (the app fires its own query);
  // appendHistory records it as lastMessage or lastResponse by its type.
  const latest = useRef({});
  latest.current = { send, clearHistory, download, commit, override, appended };
  const actions = useMemo(
    () => ({
      sendMessage: async (messageObject) => {
        const { isValid, error: why } = validateSingleMessageObject(messageObject);
        if (!isValid) return toast.error(why);
        latest.current.send(messageObject, false);
      },
      appendHistory: async (messageObject) => {
        const { isValid, error: why } = validateSingleMessageObject(messageObject);
        if (!isValid) return toast.error(why);
        const message = buildMessage(messageObject, peopleRef.current, uuidv4());
        latest.current.appended.current = true;
        latest.current.commit(
          [...historyRef.current, message],
          message.type === 'message' ? { lastMessage: message } : { lastResponse: message }
        );
      },
      clearHistory: async () => latest.current.clearHistory(false),
      setHistory: async (next) => {
        const { isValid, error: why } = validateMessageHistory(next);
        if (!isValid) return toast.error(why);
        latest.current.commit(next);
      },
      downloadChat: async () => latest.current.download(),
      setError: async (message) => {
        const textValue = typeof message === 'string' ? message : '';
        setError(textValue || 'Some error occurred. Please retry.');
      },
      setResponseLoading: async (v) => latest.current.override('loadingResponse', truthy(v)),
      setHistoryLoading: async (v) => latest.current.override('loadingHistory', truthy(v)),
      setInputDisable: async (v) => latest.current.override('disableInput', truthy(v)),
      setResponderAvatar: async (v) => latest.current.override('respondentAvatar', typeof v === 'string' ? v : ''),
      setUserAvatar: async (v) => latest.current.override('userAvatar', typeof v === 'string' ? v : ''),
    }),
    []
  );

  // The history is published on its own (and at once by every change, so an event handler reads it): comparing a long
  // history by content on every keystroke would cost more than it saves.
  useEffect(() => {
    setExposedVariables({ history });
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, p, {
    isHistoryLoading: historyLoading,
    isInputDisabled: inputDisabled,
    isResponseLoading: responseLoading,
    ...last,
    ...actions,
  });

  // ---- Rows ----------------------------------------------------------------------------------------------------------

  const showAvatars = p.showAvatars !== false;
  const showTimestamps = p.showTimestamps !== false;
  const allRows = useMemo(
    () => toRows(history),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history]
  );
  const [shown, setShown] = useState(MESSAGES_PER_STEP);
  const hidden = Math.max(0, allRows.length - shown);
  const rows = useMemo(
    () => withRuns(allRows.slice(hidden), people),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRows, hidden, people.userName, people.userAvatar, people.respondentName, people.respondentAvatar]
  );
  const errorRow = error
    ? withRuns(
        [{ key: 'error', type: 'error', text: error, name: '', avatar: '', timestamp: new Date().toISOString() }],
        people
      )[0]
    : null;
  const respondent = sender({ type: 'response', name: '', avatar: '' }, people);

  // ---- Scrolling -----------------------------------------------------------------------------------------------------

  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const spacerRef = useRef(null);
  const follow = useRef(true);
  const programmaticUntil = useRef(0);
  const anchorKey = useRef(null);
  const previousKeys = useRef(null);
  const [atEnd, setAtEnd] = useState(true);

  const scrollTo = (top, smooth) => {
    const el = viewportRef.current;
    if (!el) return;
    programmaticUntil.current = Date.now() + (smooth ? 600 : 80);
    if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    else el.scrollTop = top;
  };

  const anchorElement = () =>
    anchorKey.current && contentRef.current
      ? Array.from(contentRef.current.querySelectorAll('[data-message-key]')).find(
          (n) => n.getAttribute('data-message-key') === anchorKey.current
        )
      : null;

  // The room under an anchored user turn: enough for the turn to sit near the top while its reply is shorter than
  // the view. Set on the element directly, so it is in place before the scroll that needs it.
  const updateSpacer = () => {
    const el = viewportRef.current;
    const content = contentRef.current;
    const spacer = spacerRef.current;
    if (!el || !content || !spacer) return;
    const anchor = anchorElement();
    const below = anchor ? content.offsetTop + content.offsetHeight - anchor.offsetTop : 0;
    // The view's bottom padding scrolls too, so it counts as room already there.
    const padding = parseFloat(window.getComputedStyle(el).paddingBottom) || 0;
    spacer.style.height = `${anchor ? spacerHeight(el.clientHeight - padding, ANCHOR_PEEK, below) : 0}px`;
  };

  const toEnd = (smooth) => {
    const el = viewportRef.current;
    if (el) scrollTo(el.scrollHeight, smooth);
  };

  const rowKeys = rows.map((r) => r.key).join('\u0000');
  useLayoutEffect(() => {
    const keys = allRows.map((r) => r.key);
    const target = appended.current ? anchorTarget(previousKeys.current, allRows) : null;
    appended.current = false;
    const replaced =
      previousKeys.current !== null &&
      !target &&
      (keys.length < previousKeys.current.length || previousKeys.current.some((k, i) => keys[i] !== k));
    previousKeys.current = keys;
    if (target) {
      anchorKey.current = target;
      follow.current = true;
      updateSpacer();
      const anchor = anchorElement();
      if (anchor) scrollTo(Math.max(0, anchor.offsetTop - ANCHOR_PEEK), true);
      return;
    }
    if (replaced) {
      anchorKey.current = null;
      follow.current = true;
    }
    updateSpacer();
    if (follow.current) toEnd(false);
  }, [rowKeys, responseLoading, historyLoading, error]); // eslint-disable-line react-hooks/exhaustive-deps

  // Content that grows without a new row (a long reply rendering, an image loading) keeps the view at the end while
  // the reader follows, and shrinks the room under an anchored turn.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      updateSpacer();
      if (follow.current) toEnd(false);
      setAtEnd(isNearBottom(viewportRef.current));
    });
    ro.observe(content);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = viewportRef.current;
    const near = isNearBottom(el);
    setAtEnd(near);
    if (near) follow.current = true;
    else if (Date.now() > programmaticUntil.current) follow.current = false;
  };
  // Scrolling up by wheel or touch releases the view at once, even during a smooth scroll the widget started.
  const release = (e) => {
    if (e.type === 'wheel' && e.deltaY >= 0) return;
    follow.current = false;
    programmaticUntil.current = 0;
  };
  const jump = () => {
    follow.current = true;
    toEnd(true);
  };

  // ---- Input ---------------------------------------------------------------------------------------------------------

  const inputRef = useRef(null);
  const fitInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight || 24, MAX_INPUT_HEIGHT)}px`;
  };
  const canSend = !!draft.trim() && !locked && !responseLoading;
  const submit = () => {
    if (!canSend) return;
    send({ message: draft, type: 'message' }, true);
    setDraft('');
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fitInput);
  };

  const showHeader = !!String(p.chatTitle ?? '').trim() || p.enableClearHistoryButton || p.enableDownloadHistoryButton;
  const empty = !historyLoading && !rows.length && !error && !responseLoading;

  return (
    <Shell {...props} properties={p} className="h-full">
      <div
        id={id}
        className="relative flex h-full flex-col overflow-hidden border border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,var(--sc-card))] text-[color:var(--lk-fg,var(--sc-foreground))]"
        style={{
          height: props.height ? Number(props.height) : '100%',
          borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        }}
      >
        {showHeader ? (
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[color:var(--lk-border,var(--sc-border))] px-4">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{String(p.chatTitle ?? '')}</span>
            {p.enableDownloadHistoryButton ? (
              <IconButton label="Download chat history" onClick={download} disabled={busy(p)}>
                <Download />
              </IconButton>
            ) : null}
            {p.enableClearHistoryButton ? (
              <IconButton label="Clear history" onClick={() => clearHistory(true)} disabled={busy(p)}>
                <Trash2 />
              </IconButton>
            ) : null}
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1">
          <div
            ref={viewportRef}
            role="region"
            aria-label="Messages"
            tabIndex={0}
            onScroll={onScroll}
            onWheel={release}
            onTouchMove={release}
            className="relative h-full overflow-y-auto overscroll-contain px-4 pb-2 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div
              ref={contentRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={responseLoading || undefined}
            >
              {hidden > 0 && !historyLoading ? (
                <div className="flex justify-center pt-3">
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + MESSAGES_PER_STEP)}
                    className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {`Show ${Math.min(MESSAGES_PER_STEP, hidden)} earlier messages`}
                  </button>
                </div>
              ) : null}
              {historyLoading ? (
                <HistorySkeleton />
              ) : (
                rows.map((row) => (
                  <MessageRow key={row.key} row={row} showAvatars={showAvatars} showTimestamps={showTimestamps} />
                ))
              )}
              {!historyLoading && errorRow ? (
                <MessageRow row={errorRow} showAvatars={showAvatars} showTimestamps={showTimestamps} />
              ) : null}
              {responseLoading && !historyLoading ? (
                <Typing name={respondent.name} avatar={respondent.avatar} showAvatars={showAvatars} />
              ) : null}
              {empty ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-6 w-6 opacity-60" aria-hidden="true" />
                  <span>{String(p.emptyText ?? '') || 'Start the conversation'}</span>
                </div>
              ) : null}
            </div>
            <div ref={spacerRef} aria-hidden="true" data-chat-spacer="" />
          </div>
          <button
            type="button"
            aria-label="Jump to latest"
            title="Jump to latest"
            onClick={jump}
            tabIndex={atEnd ? -1 : 0}
            data-active={!atEnd}
            className={cn(
              'absolute bottom-3 left-1/2 inline-flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-[color:var(--lk-border,var(--sc-border))] bg-background text-foreground shadow-md transition-all duration-200 hover:bg-muted [&_svg]:size-4',
              atEnd ? 'pointer-events-none translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
            )}
          >
            <ArrowDown />
          </button>
        </div>

        <div className="shrink-0 px-3 pb-3 pt-1">
          <div
            className={cn(
              'flex items-end gap-2 rounded-xl border border-[color:var(--lk-field-border,var(--sc-input))] bg-[color:var(--lk-field-bg,var(--sc-background))] p-1.5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-ring))_45%,transparent)]',
              locked && 'opacity-60'
            )}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              aria-label="Message"
              placeholder={String(p.placeholder ?? '')}
              disabled={locked}
              onChange={(e) => {
                setDraft(e.target.value);
                fitInput();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="min-h-[24px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-6 text-[color:var(--lk-field-fg,var(--sc-foreground))] shadow-none outline-none placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
              style={{ maxHeight: MAX_INPUT_HEIGHT }}
            />
            <button
              type="button"
              aria-label="Send message"
              title="Send"
              onClick={submit}
              disabled={!canSend}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lk-accent,var(--sc-primary))] text-[color:var(--lk-send,var(--sc-primary-foreground))] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4"
            >
              <ArrowUp />
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
};
