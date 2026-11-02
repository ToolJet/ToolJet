import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AlertCircle, ArrowDown, ArrowUp, Check, Copy, Download, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  MESSAGES_PER_STEP,
  buildMessage,
  formatTimestamp,
  isNearBottom,
  sender,
  toMessageInput,
  toRows,
  withRuns,
  type ChatMessage,
  type RunRow,
} from '../lib/ui2/display/chat/chatModel';
import { Markdown } from '../lib/ui2/display/chat/markdown';
import { avatarHue, initials, lookVars, px, safeImageUrl, truthy } from '../lib/ui2/display/chat/values';
import { LoadingBox, LoadingFrame, useLoading } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display-chat.css';

// UI 2.0's Chat (Ui2/Chat): the native Chat's properties, styles, events, exposed values and actions in the pack's
// look. Messages are the native Chat's objects ({ message, messageId, timestamp, name, avatar, type }); initialChat
// seeds the history, onMessageSent fires on a send, and the app adds the reply with appendHistory. Replies render as
// Markdown; the view follows new messages while the reader is at the end, with Jump to latest when scrolled up.

const MAX_INPUT_HEIGHT = 160;

const ChatAvatar = ({ src, name }: { src: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const url = safeImageUrl(src);
  if (url && !failed) return <img className="ui2c-avatar" src={url} alt="" onError={() => setFailed(true)} />;
  const hue = avatarHue(name);
  return (
    <span
      className="ui2c-avatar ui2c-avatar--initials"
      aria-hidden="true"
      style={{
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--ui-bg))`,
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--ui-fg))`,
      }}
    >
      {initials(name) || '?'}
    </span>
  );
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      className="ui2c-copy"
      aria-label={copied ? 'Copied' : 'Copy message'}
      title={copied ? 'Copied' : 'Copy'}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => setCopied(true),
          () => undefined
        );
      }}
    >
      {copied ? <Check /> : <Copy />}
    </button>
  );
};

const MessageRow = React.memo(
  ({ row, showAvatars, showTimestamps }: { row: RunRow; showAvatars: boolean; showTimestamps: boolean }) => {
    const mine = row.type === 'message';
    const isError = row.type === 'error';
    return (
      <div
        className={cn('ui2c-row', mine && 'is-mine', row.first && 'is-first')}
        data-type={row.type}
        data-message-key={row.key}
      >
        {showAvatars ? (
          <div className="ui2c-avatar-slot">
            {row.last ? <ChatAvatar src={row.who.avatar} name={row.who.name} /> : null}
          </div>
        ) : null}
        <div className="ui2c-col">
          {row.first ? (
            <div className="ui2c-meta">
              <span className="ui2c-name">{row.who.name}</span>
              {showTimestamps ? <span className="ui2c-time">{formatTimestamp(row.timestamp)}</span> : null}
            </div>
          ) : null}
          <div
            className={cn(
              'ui2c-bubble',
              mine ? 'ui2c-bubble--mine' : isError ? 'ui2c-bubble--error' : 'ui2c-bubble--reply'
            )}
          >
            {isError ? <AlertCircle className="ui2c-error-icon" aria-hidden="true" /> : null}
            {mine || isError ? <span className="ui2c-plain">{row.text}</span> : <Markdown content={row.text} />}
          </div>
          <div className="ui2c-tools">{row.text ? <CopyButton value={row.text} /> : null}</div>
        </div>
      </div>
    );
  }
);
MessageRow.displayName = 'MessageRow';

type Event = { name: string };

export const Chat = () => {
  const [chatTitle] = ToolJet.useStateString({ name: 'chatTitle', label: 'Chat title', initialValue: 'Chat' });
  const [initialChat] = ToolJet.useStateArray({
    name: 'initialChat',
    label: 'Initial chat',
    description: "Array of { message, messageId, timestamp, name, avatar, type: 'message' | 'response' | 'error' }.",
    initialValue: [
      {
        message: 'Hi! Ask me anything about your orders, invoices or deliveries.',
        messageId: 'welcome-1',
        timestamp: 'new Date().toISOString()',
        name: 'Assistant',
        avatar: '',
        type: 'response',
      },
    ],
  });
  // UI 2.0 binds {{globals.currentUser.firstName}} here; a pack default is a plain value.
  const [userName] = ToolJet.useStateString({ name: 'userName', label: 'User name', initialValue: 'You' });
  const [userAvatar, setUserAvatar] = ToolJet.useStateString({
    name: 'userAvatar',
    label: 'User avatar',
    initialValue: '',
  });
  const [respondentName] = ToolJet.useStateString({
    name: 'respondentName',
    label: 'Respondent name',
    initialValue: 'Assistant',
  });
  const [respondentAvatar, setRespondentAvatar] = ToolJet.useStateString({
    name: 'respondentAvatar',
    label: 'Respondent avatar',
    initialValue: '',
  });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder for input field',
    initialValue: 'Ask me anything!',
  });
  const [emptyText] = ToolJet.useStateString({
    name: 'emptyText',
    label: 'Empty chat text',
    initialValue: 'Start the conversation',
  });
  const [disableInput, setDisableInput] = ToolJet.useStateBoolean({
    name: 'disableInput',
    label: 'Disable input state',
    initialValue: false,
  });
  const [loadingHistory, setLoadingHistory] = ToolJet.useStateBoolean({
    name: 'loadingHistory',
    label: 'History loading state',
    initialValue: false,
  });
  const [loadingResponse, setLoadingResponse] = ToolJet.useStateBoolean({
    name: 'loadingResponse',
    label: 'Response loading state',
    initialValue: false,
  });
  const [enableClearHistoryButton] = ToolJet.useStateBoolean({
    name: 'enableClearHistoryButton',
    label: 'Enable clear history icon',
    initialValue: true,
  });
  const [enableDownloadHistoryButton] = ToolJet.useStateBoolean({
    name: 'enableDownloadHistoryButton',
    label: 'Enable download history icon',
    initialValue: true,
  });
  const [showAvatars] = ToolJet.useStateBoolean({ name: 'showAvatars', label: 'Show avatars', initialValue: true });
  const [showTimestamps] = ToolJet.useStateBoolean({
    name: 'showTimestamps',
    label: 'Show timestamps',
    initialValue: true,
  });
  // Exposed values.
  const [history, setHistory] = ToolJet.useStateArray({
    name: 'history',
    initialValue: Array.isArray(initialChat) ? initialChat : [],
    inspector: 'hidden',
  });
  const [, setIsHistoryLoading] = ToolJet.useStateBoolean({
    name: 'isHistoryLoading',
    initialValue: false,
    inspector: 'hidden',
  });
  const [, setIsInputDisabled] = ToolJet.useStateBoolean({
    name: 'isInputDisabled',
    initialValue: false,
    inspector: 'hidden',
  });
  const [, setIsResponseLoading] = ToolJet.useStateBoolean({
    name: 'isResponseLoading',
    initialValue: false,
    inspector: 'hidden',
  });
  const [, setLastMessage] = ToolJet.useStateObject({ name: 'lastMessage', initialValue: {}, inspector: 'hidden' });
  const [, setLastResponse] = ToolJet.useStateObject({ name: 'lastResponse', initialValue: {}, inspector: 'hidden' });
  const onMessageSent = ToolJet.useEventCallback({ name: 'onMessageSent', displayName: 'On message sent' } as Event);
  const onClearHistory = ToolJet.useEventCallback({
    name: 'onClearHistory',
    displayName: 'On history cleared',
  } as Event);

  const containerBackgroundColor = useThemeColor('containerBackgroundColor', 'Background', TOKEN.surface);
  const borderColorContainer = useThemeColor('borderColorContainer', 'Border', TOKEN.border);
  const borderRadius = useThemeRadius('borderRadius', 'Border radius');
  const accentColorField = useThemeColor('accentColorField', 'Accent (your messages, send button, focus)', TOKEN.brand);
  const responseBubbleColor = useThemeColor('responseBubbleColor', 'Reply bubble background', TOKEN.muted);
  const nameColor = useThemeColor('name', 'Name color', TOKEN.text);
  const messageColor = useThemeColor('message', 'Message text color', TOKEN.text);
  const timestampColor = useThemeColor('timestamp', 'Timestamp color', TOKEN.mutedText);
  const backgroundColorField = useThemeColor('backgroundColorField', 'Input background', TOKEN.surface);
  const borderColorField = useThemeColor('borderColorField', 'Input border', TOKEN.border);
  const textColorField = useThemeColor('textColorField', 'Input text color', TOKEN.text);
  const sendIconColorField = useThemeColor('sendIconColorField', 'Send icon color', TOKEN.surface);
  const loadingNow = useLoading();
  ToolJet.useComponentSettings({ role: 'chat', fit: false, loading: 'own', defaultWidth: 15, defaultHeight: 48 });

  const people = useMemo(
    () => ({ userName, userAvatar, respondentName, respondentAvatar }),
    [userName, userAvatar, respondentName, respondentAvatar]
  );
  const initial = useMemo(() => (Array.isArray(initialChat) ? initialChat : []), [initialChat]);
  const list = useMemo((): unknown[] => (Array.isArray(history) ? history : []), [history]);
  const historyRef = useRef(list);
  historyRef.current = list;
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // A new initialChat (an inspector edit, a binding that loaded) replaces the history, as the native Chat does.
  const initialKey = useMemo(() => {
    try {
      return JSON.stringify(initial);
    } catch {
      return String(initial.length);
    }
  }, [initial]);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setHistory(initial);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  // The state flags, exposed as UI 2.0 names them.
  useEffect(() => setIsHistoryLoading(!!loadingHistory), [loadingHistory]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setIsInputDisabled(!!disableInput), [disableInput]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setIsResponseLoading(!!loadingResponse), [loadingResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set by a send or an appendHistory, so the view moves to the new message even when the reader had scrolled up.
  const appended = useRef(false);
  const commit = (next: unknown[]) => {
    historyRef.current = next;
    setHistory(next);
    setError(null);
  };
  const add = (message: ChatMessage) => {
    appended.current = true;
    commit([...historyRef.current, message]);
  };
  const asRecord = (m: ChatMessage) => m as unknown as Record<string, unknown>;

  const send = (text: string, shouldFire: boolean) => {
    const message = buildMessage({ message: text, type: 'message' }, people);
    add(message);
    setLastMessage(asRecord(message));
    if (shouldFire) onMessageSent();
  };
  const clearHistory = (shouldFire: boolean) => {
    commit(initial);
    setLastMessage({});
    setLastResponse({});
    if (shouldFire) onClearHistory();
  };
  const download = () => {
    const current = historyRef.current;
    if (!current.length) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  // The native Chat's actions. sendMessage adds a message without firing onMessageSent (the app fires its own query);
  // appendHistory records it as lastMessage or lastResponse by its type. Plain text reads as a message (sendMessage)
  // or a reply (appendHistory).
  ToolJet.useAction(
    {
      name: 'appendHistory',
      displayName: 'Append history',
      params: [{ handle: 'message', displayName: 'Message', defaultValue: '{{{}}}' }],
    },
    (raw) => {
      const input = toMessageInput(raw, 'response');
      if (!input) return;
      const message = buildMessage(input, people);
      add(message);
      if (message.type === 'message') setLastMessage(asRecord(message));
      else setLastResponse(asRecord(message));
    }
  );
  ToolJet.useAction({ name: 'clearHistory', displayName: 'Clear history' }, () => clearHistory(false));
  ToolJet.useAction({ name: 'downloadChat', displayName: 'Download chat' }, () => download());
  ToolJet.useAction(
    {
      name: 'sendMessage',
      displayName: 'Send message',
      params: [{ handle: 'message', displayName: 'Message', defaultValue: '{{{}}}' }],
    },
    (raw) => {
      const input = toMessageInput(raw, 'message');
      if (!input) return;
      const message = buildMessage(input, people);
      add(message);
      setLastMessage(asRecord(message));
    }
  );
  ToolJet.useAction(
    { name: 'setError', displayName: 'Set error', params: [{ handle: 'error', displayName: 'Error' }] },
    (message) => {
      setError(typeof message === 'string' && message ? message : 'Some error occurred. Please retry.');
    }
  );
  ToolJet.useAction(
    {
      name: 'setHistory',
      displayName: 'Set history',
      params: [{ handle: 'history', displayName: 'History', defaultValue: '{{[]}}' }],
    },
    (next) => {
      if (Array.isArray(next)) commit(next);
    }
  );
  ToolJet.useAction(
    {
      name: 'setHistoryLoading',
      displayName: 'Set history loading',
      params: [{ handle: 'loading', displayName: 'Loading', type: 'toggle', defaultValue: '{{false}}' }],
    },
    (v) => setLoadingHistory(truthy(v))
  );
  ToolJet.useAction(
    {
      name: 'setInputDisable',
      displayName: 'Set input disable',
      params: [{ handle: 'disabled', displayName: 'Disabled', type: 'toggle', defaultValue: '{{false}}' }],
    },
    (v) => setDisableInput(truthy(v))
  );
  ToolJet.useAction(
    {
      name: 'setResponderAvatar',
      displayName: 'Set respondent avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar' }],
    },
    (v) => setRespondentAvatar(typeof v === 'string' ? v : '')
  );
  ToolJet.useAction(
    {
      name: 'setResponseLoading',
      displayName: 'Set response loading',
      params: [{ handle: 'loading', displayName: 'Loading', type: 'toggle', defaultValue: '{{false}}' }],
    },
    (v) => setLoadingResponse(truthy(v))
  );
  ToolJet.useAction(
    { name: 'setUserAvatar', displayName: 'Set user avatar', params: [{ handle: 'avatar', displayName: 'Avatar' }] },
    (v) => setUserAvatar(typeof v === 'string' ? v : '')
  );

  // ---- Rows

  const allRows = useMemo(() => toRows(list), [list]);
  const [shown, setShown] = useState(MESSAGES_PER_STEP);
  const hidden = Math.max(0, allRows.length - shown);
  const rows = useMemo(() => withRuns(allRows.slice(hidden), people), [allRows, hidden, people]);
  const errorRow = error
    ? withRuns(
        [{ key: 'error', type: 'error', text: error, name: '', avatar: '', timestamp: new Date().toISOString() }],
        people
      )[0]
    : null;
  const respondent = sender({ type: 'response', name: '', avatar: '' }, people);

  // ---- Scrolling: follow new content while at the end; a send or an append always moves to it.

  const viewportRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(true);
  const atEndRef = useRef(true);
  const toEnd = (smooth: boolean) => {
    const el = viewportRef.current;
    if (el && typeof el.scrollTo === 'function')
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };
  useLayoutEffect(() => {
    if (appended.current || atEndRef.current) toEnd(appended.current);
    appended.current = false;
  }, [rows.length, allRows.length, loadingResponse, loadingHistory, error]);
  const onScroll = () => {
    const end = isNearBottom(viewportRef.current);
    atEndRef.current = end;
    if (end !== atEnd) setAtEnd(end);
  };

  // ---- Input

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fitInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight || 24, MAX_INPUT_HEIGHT)}px`;
  };
  const locked = !!disableInput;
  const canSend = !!draft.trim() && !locked && !loadingResponse;
  const submit = () => {
    if (!canSend) return;
    send(draft, true);
    setDraft('');
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fitInput);
  };

  const showHeader = !!String(chatTitle ?? '').trim() || enableClearHistoryButton || enableDownloadHistoryButton;
  const empty = !loadingHistory && !rows.length && !error && !loadingResponse;
  const style = lookVars([
    [containerBackgroundColor, '--lk-bg'],
    [borderColorContainer, '--lk-border'],
    [borderRadius, '--lk-radius', px],
    [accentColorField, '--lk-accent'],
    [responseBubbleColor, '--lk-bubble'],
    [nameColor, '--lk-name'],
    [messageColor, '--lk-fg'],
    [timestampColor, '--lk-muted'],
    [backgroundColorField, '--lk-field-bg'],
    [borderColorField, '--lk-field-border'],
    [textColorField, '--lk-field-fg'],
    [sendIconColorField, '--lk-send'],
  ]);

  return (
    <LoadingFrame loading={loadingNow} look={<LoadingBox />}>
      <div className="ui ui2c" style={style as React.CSSProperties}>
        {showHeader ? (
          <div className="ui2c-head">
            <span className="ui2c-title">{String(chatTitle ?? '')}</span>
            {enableDownloadHistoryButton ? (
              <button
                type="button"
                className="ui2c-icon-btn"
                aria-label="Download chat history"
                title="Download chat history"
                onClick={download}
              >
                <Download />
              </button>
            ) : null}
            {enableClearHistoryButton ? (
              <button
                type="button"
                className="ui2c-icon-btn"
                aria-label="Clear history"
                title="Clear history"
                onClick={() => clearHistory(true)}
              >
                <Trash2 />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="ui2c-body">
          <div
            ref={viewportRef}
            role="region"
            aria-label="Messages"
            tabIndex={0}
            onScroll={onScroll}
            className="ui2c-viewport"
          >
            <div role="log" aria-live="polite" aria-relevant="additions" aria-busy={loadingResponse || undefined}>
              {hidden > 0 && !loadingHistory ? (
                <div className="ui2c-earlier">
                  <button type="button" onClick={() => setShown((n) => n + MESSAGES_PER_STEP)}>
                    {`Show ${Math.min(MESSAGES_PER_STEP, hidden)} earlier messages`}
                  </button>
                </div>
              ) : null}
              {loadingHistory ? (
                <div className="ui2c-skeleton" aria-busy="true" aria-label="Loading messages">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn('ui2c-skeleton-row', i === 1 && 'is-mine')}>
                      <span className="ui-skeleton ui2c-skeleton-avatar" />
                      <div className="ui2c-skeleton-col">
                        <span className="ui-skeleton ui2c-skeleton-name" />
                        <span className="ui-skeleton ui2c-skeleton-bubble" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                rows.map((row) => (
                  <MessageRow key={row.key} row={row} showAvatars={!!showAvatars} showTimestamps={!!showTimestamps} />
                ))
              )}
              {!loadingHistory && errorRow ? (
                <MessageRow row={errorRow} showAvatars={!!showAvatars} showTimestamps={!!showTimestamps} />
              ) : null}
              {loadingResponse && !loadingHistory ? (
                <div className="ui2c-row is-first" role="status" aria-label={`${respondent.name} is typing`}>
                  {showAvatars ? (
                    <div className="ui2c-avatar-slot ui2c-avatar-slot--typing">
                      <ChatAvatar src={respondent.avatar} name={respondent.name} />
                    </div>
                  ) : null}
                  <div className="ui2c-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
              {empty ? (
                <div className="ui2c-empty">
                  <MessageSquare aria-hidden="true" />
                  <span>{String(emptyText ?? '') || 'Start the conversation'}</span>
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className={cn('ui2c-jump', !atEnd && 'is-active')}
            aria-label="Jump to latest"
            title="Jump to latest"
            tabIndex={atEnd ? -1 : 0}
            onClick={() => {
              atEndRef.current = true;
              setAtEnd(true);
              toEnd(true);
            }}
          >
            <ArrowDown />
          </button>
        </div>

        <div className="ui2c-composer-wrap">
          <div className={cn('ui2c-composer', locked && 'is-locked')}>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              aria-label="Message"
              placeholder={String(placeholder ?? '')}
              disabled={locked}
              onChange={(e) => {
                setDraft(e.target.value);
                fitInput();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="ui2c-input"
              style={{ maxHeight: MAX_INPUT_HEIGHT }}
            />
            <button
              type="button"
              className="ui2c-send"
              aria-label="Send message"
              title="Send"
              onClick={submit}
              disabled={!canSend}
            >
              <ArrowUp />
            </button>
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
};
