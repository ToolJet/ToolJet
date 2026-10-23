import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { ArrowDown, ArrowUp, Download, MessageSquare, Trash2 } from 'lucide-react';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useExposed, useLatest, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { truthy, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import {
  MESSAGES_PER_STEP,
  buildMessage,
  sender,
  toRows,
  withRuns,
  type ChatMessage,
  type MessageInput,
} from './chatModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** The last message sent and the last response, as exposed ({} before there is one). */
interface LastValues {
  lastMessage?: ChatMessage | Record<string, never>;
  lastResponse?: ChatMessage | Record<string, never>;
}
import { HistorySkeleton, IconButton, MessageRow, Typing } from './ChatParts';
import { useChatScroll } from './useChatScroll';
import { validateMessageHistory, validateSingleMessageObject } from '@/AppBuilder/Widgets/Ui2/_shared/chatHelpers';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// ToolJet UI 2.0 Chat: the native Chat widget (Widgets/Chat) in the pack's look, with its properties, events, exposed
// values and actions. Config in WidgetManager/widgets/shad*.js, message and scroll logic in chatModel.ts, the message
// rows in ChatParts.tsx, style variables in looks/conversation.ts. Scrolling (useChatScroll.ts) follows shadcn's
// Message Scroller: the view follows new content only while the reader is at the end; a new user turn moves near the
// top with its reply growing below it; scrolled up, nothing moves the reader and a Jump to latest button brings them
// back.

const MAX_INPUT_HEIGHT = 160;

export const ShadChat = (props: WidgetProps) => {
  const { properties: raw, setExposedVariables, fireEvent, id } = props;
  const [p, override] = useOverrides(raw);
  const people = useMemo(
    () => ({
      userName: p.userName,
      userAvatar: p.userAvatar,
      respondentName: p.respondentName,
      respondentAvatar: p.respondentAvatar,
    }),
    [p.userName, p.userAvatar, p.respondentName, p.respondentAvatar]
  );
  const peopleRef = useRef(people);
  peopleRef.current = people;

  const initialChat = useStable(p.initialChat);
  const initial = useMemo((): unknown[] => (Array.isArray(initialChat) ? initialChat : []), [initialChat]);
  const [history, setHistory] = useState(initial);
  const historyRef = useRef(history);
  historyRef.current = history;
  const [last, setLast] = useState<LastValues>({ lastMessage: {}, lastResponse: {} });
  const [error, setError] = useState<string | null>(null);
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
    (next: unknown[], lastValues?: LastValues) => {
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

  const send = (messageObject: MessageInput, shouldFire: boolean) => {
    const message = buildMessage(messageObject, peopleRef.current, uuidv4());
    appended.current = true;
    commit([...historyRef.current, message], { lastMessage: message });
    if (shouldFire) fireEvent('onMessageSent');
  };

  const clearHistory = (shouldFire: boolean) => {
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
      // The link and the blob URL go even when the click throws (they were left in the page, the blob held).
      try {
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(url);
      }
      toast.success('Chat history downloaded successfully');
    } catch {
      toast.error('Failed to download chat history');
    }
  };

  // The native Chat's actions. sendMessage adds a message without firing onMessageSent (the app fires its own query);
  // appendHistory records it as lastMessage or lastResponse by its type.
  const latest = useRef({ send, clearHistory, download, commit, override, appended });
  latest.current = { send, clearHistory, download, commit, override, appended };
  const actions = useMemo(
    () => ({
      sendMessage: async (messageObject: MessageInput) => {
        const { isValid, error: why } = validateSingleMessageObject(messageObject);
        if (!isValid) return toast.error(why ?? '');
        latest.current.send(messageObject, false);
      },
      appendHistory: async (messageObject: MessageInput) => {
        const { isValid, error: why } = validateSingleMessageObject(messageObject);
        if (!isValid) return toast.error(why ?? '');
        const message = buildMessage(messageObject, peopleRef.current, uuidv4());
        latest.current.appended.current = true;
        latest.current.commit(
          [...historyRef.current, message],
          message.type === 'message' ? { lastMessage: message } : { lastResponse: message }
        );
      },
      clearHistory: async () => latest.current.clearHistory(false),
      setHistory: async (next: unknown[]) => {
        const { isValid, error: why } = validateMessageHistory(next);
        if (!isValid) return toast.error(why ?? '');
        latest.current.commit(next);
      },
      downloadChat: async () => latest.current.download(),
      setError: async (message: unknown) => {
        const textValue = typeof message === 'string' ? message : '';
        setError(textValue || 'Some error occurred. Please retry.');
      },
      setResponseLoading: async (v: unknown) => latest.current.override('loadingResponse', truthy(v)),
      setHistoryLoading: async (v: unknown) => latest.current.override('loadingHistory', truthy(v)),
      setInputDisable: async (v: unknown) => latest.current.override('disableInput', truthy(v)),
      setResponderAvatar: async (v: unknown) =>
        latest.current.override('respondentAvatar', typeof v === 'string' ? v : ''),
      setUserAvatar: async (v: unknown) => latest.current.override('userAvatar', typeof v === 'string' ? v : ''),
    }),
    []
  );

  // The history is published on its own (and at once by every change, so an event handler reads it): comparing a long
  // history by content on every keystroke would cost more than it saves.
  const publish = useLatest(setExposedVariables);
  useEffect(() => {
    publish.current({ history });
  }, [history, publish]);
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
  const allRows = useMemo(() => toRows(history), [history]);
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

  // ---- Scrolling -----------------------------------------------------------------------------------------------------

  const { viewportRef, contentRef, spacerRef, atEnd, onScroll, release, jump } = useChatScroll({
    rows,
    allRows,
    appended,
    responseLoading,
    historyLoading,
    error,
  });

  // ---- Input ---------------------------------------------------------------------------------------------------------

  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    <Shell {...props} properties={p} className="tw-h-full">
      <div
        id={id}
        className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-border tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--lk-bg,var(--sc-card))] tw-text-[color:var(--lk-fg,var(--sc-foreground))]"
        style={{
          height: props.height ? Number(props.height) : '100%',
          borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        }}
      >
        {showHeader ? (
          <div className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-gap-2 tw-border-b tw-border-[color:var(--lk-border,var(--sc-border))] tw-px-4">
            <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-ui2-sm tw-font-semibold">
              {String(p.chatTitle ?? '')}
            </span>
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

        <div className="tw-relative tw-min-h-0 tw-flex-1">
          <div
            ref={viewportRef}
            role="region"
            aria-label="Messages"
            tabIndex={0}
            onScroll={onScroll}
            onWheel={release}
            onTouchMove={release}
            className="tw-relative tw-h-full tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-pb-2 tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-ui2-ring"
          >
            <div
              ref={contentRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={responseLoading || undefined}
            >
              {hidden > 0 && !historyLoading ? (
                <div className="tw-flex tw-justify-center tw-pt-3">
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + MESSAGES_PER_STEP)}
                    className="tw-rounded-ui2-md tw-px-3 tw-py-1.5 tw-text-xs tw-text-ui2-muted-foreground tw-transition-colors hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground"
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
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-py-12 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">
                  <MessageSquare className="tw-h-6 tw-w-6 tw-opacity-60" aria-hidden="true" />
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
              'tw-absolute tw-bottom-3 tw-left-1/2 tw-inline-flex tw-h-8 tw-w-8 -tw-translate-x-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-ui2-background tw-text-ui2-foreground tw-shadow-md tw-transition-all tw-duration-200 hover:tw-bg-ui2-muted [&_svg]:tw-size-4',
              atEnd ? 'tw-pointer-events-none tw-translate-y-2 tw-opacity-0' : 'tw-translate-y-0 tw-opacity-100'
            )}
          >
            <ArrowDown />
          </button>
        </div>

        <div className="tw-shrink-0 tw-px-3 tw-pb-3 tw-pt-1">
          <div
            className={cn(
              'tw-flex tw-items-end tw-gap-2 tw-rounded-ui2-xl tw-border tw-border-[color:var(--lk-field-border,var(--sc-input))] tw-bg-[color:var(--lk-field-bg,var(--sc-background))] tw-p-1.5 tw-shadow-sm tw-transition-shadow focus-within:tw-ring-2 focus-within:tw-ring-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-ring))_45%,transparent)]',
              locked && 'sc-self-dim tw-opacity-60'
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
                if (isEnter(e) && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="tw-min-h-[24px] tw-flex-1 tw-resize-none tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-leading-6 tw-text-[color:var(--lk-field-fg,var(--sc-foreground))] tw-shadow-none tw-outline-none placeholder:tw-text-ui2-muted-foreground focus:tw-outline-none disabled:tw-cursor-not-allowed"
              style={{ maxHeight: MAX_INPUT_HEIGHT }}
            />
            <button
              type="button"
              aria-label="Send message"
              title="Send"
              onClick={submit}
              disabled={!canSend}
              className="tw-inline-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-lg tw-bg-[color:var(--lk-accent,var(--sc-primary))] tw-text-[color:var(--lk-send,var(--sc-primary-foreground))] tw-transition-opacity hover:tw-opacity-90 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 [&_svg]:tw-size-4"
            >
              <ArrowUp />
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default withControlState(ShadChat);
