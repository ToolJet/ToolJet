import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Card, Checkbox, Input, Progress, Radio, Result, Space, Spin, Tooltip, Typography } from 'antd';
import { ClearOutlined, DownloadOutlined, SendOutlined } from '@ant-design/icons';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { SpinOver } from '../lib/Loading';
import { str } from '../lib/data';
import {
  buildMessage,
  formatTimestamp,
  isNearBottom,
  toMessageInput,
  toRows,
  withRuns,
  type ChatMessage,
} from '../lib/ui2/display/chat/chatModel';
import { Markdown } from '../lib/ui2/display/chat/markdown';
import { initials } from '../lib/ui2/display/chat/values';
import { useValueSetter } from '../lib/sameValue';
import {
  answersOf,
  firstProblem,
  initialAnswers,
  isPicked,
  normalizeItems,
  pick,
  pickOther,
  problem,
  resolveIndex,
  shortcutKey,
  keyIndex,
  type Answers,
} from '../lib/ui2/display/chat/questionnaireModel';

const on = (v: unknown) => v === true || v === 'true';

// ---- Chat ------------------------------------------------------------------------------------------------------------

// A conversation in Ant parts (a Card with bubbles, Avatars, a TextArea and a send Button): title, history (messages
// { message, type: message|response, name, avatar, timestamp }), userName / userAvatar, respondentName /
// respondentAvatar, placeholder, emptyText, showAvatars, showTimestamps, allowClear / allowDownload; loading states
// (responseLoading: the respondent is typing, historyLoading, inputDisabled). onMessageSent with lastMessage, and
// history exposed; actions sendMessage, appendHistory, setHistory, clearHistory, downloadChat, setResponseLoading,
// setHistoryLoading, setInputDisable, setUserAvatar, setResponderAvatar.
export const Chat = () => {
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Assistant' });
  const [initialChat] = ToolJet.useStateArray({
    name: 'initialChat',
    label: 'History',
    description: "[{ message, type: 'message' | 'response' }]",
    initialValue: [{ message: 'Hi! Ask me anything about your orders, invoices or deliveries.', type: 'response' }],
  });
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
    label: 'Placeholder',
    initialValue: 'Type a message',
  });
  const [emptyText] = ToolJet.useStateString({
    name: 'emptyText',
    label: 'Empty text',
    initialValue: 'No messages yet',
  });
  const [showAvatars] = ToolJet.useStateBoolean({ name: 'showAvatars', label: 'Show avatars', initialValue: true });
  const [showTimestamps] = ToolJet.useStateBoolean({
    name: 'showTimestamps',
    label: 'Show timestamps',
    initialValue: true,
  });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Clear button', initialValue: false });
  const [allowDownload] = ToolJet.useStateBoolean({
    name: 'allowDownload',
    label: 'Download button',
    initialValue: false,
  });
  const [responseLoading, setResponseLoading] = ToolJet.useStateBoolean({
    name: 'responseLoading',
    label: 'Response loading',
    initialValue: false,
  });
  const [historyLoading, setHistoryLoading] = ToolJet.useStateBoolean({
    name: 'historyLoading',
    label: 'History loading',
    initialValue: false,
  });
  const [inputDisabled, setInputDisabled] = ToolJet.useStateBoolean({
    name: 'inputDisabled',
    label: 'Input disabled',
    initialValue: false,
  });
  const [history, setHistory] = ToolJet.useStateArray({ name: 'history', initialValue: [], inspector: 'hidden' });
  const [, setLastMessage] = ToolJet.useStateObject({ name: 'lastMessage', initialValue: {}, inspector: 'hidden' });
  const [, setLastResponse] = ToolJet.useStateObject({ name: 'lastResponse', initialValue: {}, inspector: 'hidden' });
  const onMessageSent = ToolJet.useEventCallback({ name: 'onMessageSent' });
  const onClearHistory = ToolJet.useEventCallback({ name: 'onClearHistory' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'chat',
    fit: false,
    loading: 'own',
    usage:
      "A chat in Ant parts: title, initialChat (history [{message, type: message|response}]), userName/userAvatar, respondentName/respondentAvatar, placeholder, emptyText, showAvatars, showTimestamps, allowClear, allowDownload, responseLoading (typing dots), historyLoading, inputDisabled. onMessageSent with lastMessage (and history) exposed; answer with appendHistory({message, type: 'response'}) and setResponseLoading(false).",
    roleProps: {
      chatTitle: 'title',
      loadingHistory: 'historyLoading',
      loadingResponse: 'responseLoading',
      disableInput: 'inputDisabled',
      enableClearHistoryButton: 'allowClear',
      enableDownloadHistoryButton: 'allowDownload',
      isHistoryLoading: 'historyLoading',
      isResponseLoading: 'responseLoading',
      isInputDisabled: 'inputDisabled',
    },
    defaultWidth: 20,
    defaultHeight: 50,
  });
  const people = { userName, userAvatar, respondentName, respondentAvatar };
  const [draft, setDraft] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  // The initial history (the property) seeds the exposed history; later the history is the chat's own.
  const seed = JSON.stringify(initialChat ?? []);
  useEffect(() => {
    setHistory(Array.isArray(initialChat) ? (initialChat as unknown[]) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  const rows = useMemo(
    () => withRuns(toRows(history), people),
    [history, userName, userAvatar, respondentName, respondentAvatar]
  );
  const stick = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [rows.length, responseLoading]);

  const append = (input: unknown, fallback: 'message' | 'response') => {
    const list = (Array.isArray(input) ? input : [input])
      .map((m) => toMessageInput(m, fallback))
      .filter(Boolean) as NonNullable<ReturnType<typeof toMessageInput>>[];
    if (!list.length) return [] as ChatMessage[];
    const built = list.map((m) => buildMessage(m, people));
    setHistory([...(Array.isArray(history) ? history : []), ...built]);
    const lastResponse = [...built].reverse().find((m) => m.type === 'response');
    if (lastResponse) setLastResponse(lastResponse as unknown as Record<string, unknown>);
    return built;
  };
  const send = (text: string) => {
    if (!text.trim()) return;
    const [m] = append(text, 'message');
    if (!m) return;
    setLastMessage(m as unknown as Record<string, unknown>);
    setDraft('');
    stick.current = true;
    onMessageSent();
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || 'chat').replace(/[^\w-]+/g, '-')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  ToolJet.useAction(
    { name: 'sendMessage', displayName: 'Send message', params: [{ handle: 'message', displayName: 'Message' }] },
    (m) => send(str(m))
  );
  ToolJet.useAction(
    {
      name: 'appendHistory',
      displayName: 'Append to history',
      params: [{ handle: 'message', displayName: 'Message(s)' }],
    },
    (m) => {
      append(m, 'response');
    }
  );
  ToolJet.useAction(
    { name: 'setHistory', displayName: 'Set history', params: [{ handle: 'history', displayName: 'History' }] },
    (h) => setHistory(Array.isArray(h) ? (h as unknown[]) : [])
  );
  ToolJet.useAction({ name: 'clearHistory', displayName: 'Clear history' }, () => {
    setHistory([]);
    onClearHistory();
  });
  ToolJet.useAction({ name: 'downloadChat', displayName: 'Download chat' }, download);
  ToolJet.useAction(
    {
      name: 'setResponseLoading',
      displayName: 'Set response loading',
      params: [{ handle: 'loading', displayName: 'Loading', type: 'toggle' }],
    },
    (v) => setResponseLoading(on(v))
  );
  ToolJet.useAction(
    {
      name: 'setHistoryLoading',
      displayName: 'Set history loading',
      params: [{ handle: 'loading', displayName: 'Loading', type: 'toggle' }],
    },
    (v) => setHistoryLoading(on(v))
  );
  ToolJet.useAction(
    {
      name: 'setInputDisable',
      displayName: 'Disable input',
      params: [{ handle: 'disabled', displayName: 'Disabled', type: 'toggle' }],
    },
    (v) => setInputDisabled(on(v))
  );
  ToolJet.useAction(
    {
      name: 'setUserAvatar',
      displayName: 'Set user avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar URL' }],
    },
    (v) => setUserAvatar(str(v))
  );
  ToolJet.useAction(
    {
      name: 'setResponderAvatar',
      displayName: 'Set respondent avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar URL' }],
    },
    (v) => setRespondentAvatar(str(v))
  );

  const face = (name: string, avatar: string, mine: boolean) =>
    avatar ? (
      <Avatar src={avatar} size={32} />
    ) : (
      <Avatar size={32} style={mine ? { background: 'var(--ant-color-primary)' } : undefined}>
        {initials(name)}
      </Avatar>
    );
  const locked = disabled || inputDisabled;
  return (
    <AntProvider tokens={tokens} fill>
      <SpinOver loading={loading} as="fill">
        <Card
          className="tj-ant-chat"
          size="small"
          title={title || undefined}
          extra={
            allowClear || allowDownload ? (
              <Space size={4}>
                {allowDownload ? (
                  <Tooltip title="Download">
                    <Button type="text" size="small" icon={<DownloadOutlined />} onClick={download} />
                  </Tooltip>
                ) : null}
                {allowClear ? (
                  <Tooltip title="Clear">
                    <Button
                      type="text"
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={() => {
                        setHistory([]);
                        onClearHistory();
                      }}
                    />
                  </Tooltip>
                ) : null}
              </Space>
            ) : undefined
          }
        >
          <div
            className="tj-ant-chat-log"
            ref={scroller}
            onScroll={() => (stick.current = isNearBottom(scroller.current))}
          >
            {historyLoading ? (
              <div className="tj-ant-chat-empty">
                <Spin />
              </div>
            ) : rows.length === 0 ? (
              <div className="tj-ant-chat-empty">
                <Typography.Text type="secondary">{emptyText}</Typography.Text>
              </div>
            ) : (
              rows.map((r) => {
                const mine = r.type === 'message';
                return (
                  <div
                    key={r.key}
                    className={`tj-ant-chat-row ${mine ? 'is-mine' : 'is-theirs'}${r.type === 'error' ? ' is-error' : ''}${r.first ? ' is-first' : ''}`}
                  >
                    {showAvatars ? (
                      <div className="tj-ant-chat-face">{r.last ? face(r.who.name, r.who.avatar, mine) : null}</div>
                    ) : null}
                    <div className="tj-ant-chat-body">
                      {r.first ? (
                        <div className="tj-ant-chat-meta">
                          <Typography.Text strong>{r.who.name}</Typography.Text>
                          {showTimestamps ? (
                            <Typography.Text type="secondary">{formatTimestamp(r.timestamp)}</Typography.Text>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="tj-ant-chat-bubble">{mine ? r.text : <Markdown content={r.text} />}</div>
                    </div>
                  </div>
                );
              })
            )}
            {responseLoading ? (
              <div className="tj-ant-chat-row is-theirs is-first">
                {showAvatars ? (
                  <div className="tj-ant-chat-face">{face(respondentName, respondentAvatar, false)}</div>
                ) : null}
                <div className="tj-ant-chat-body">
                  <div className="tj-ant-chat-bubble tj-ant-chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="tj-ant-chat-input">
            <Input.TextArea
              value={draft}
              placeholder={placeholder}
              autoSize={{ minRows: 1, maxRows: 5 }}
              disabled={locked}
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(draft);
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={locked || !draft.trim()}
              onClick={() => send(draft)}
            />
          </div>
        </Card>
      </SpinOver>
    </AntProvider>
  );
};

// ---- Questionnaire ---------------------------------------------------------------------------------------------------

// One question at a time, in Ant parts (a Card, selectable choice rows with letter shortcuts, Input, Progress, Result):
// items [{ name, prompt, description, type: single|multiple|text, choices [{ label, value, description }], other,
// required, placeholder, multiline }], defaultAnswers, shortcuts (letters, numbers, none), showProgress, submitLabel,
// completeTitle, completeText, bordered. answers, currentIndex, currentItem and isComplete exposed; onStepChanged,
// onSubmit; actions reset, goTo.
export const Questionnaire = () => {
  const [items] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: "[{ name, prompt, type: 'single', choices: ['Yes', 'No'] }]",
    initialValue: [
      {
        name: 'role',
        prompt: 'What best describes your role?',
        type: 'single',
        choices: ['Operations', 'Finance', 'Engineering'],
        other: true,
        required: true,
      },
      {
        name: 'goals',
        prompt: 'What do you want to get done first?',
        type: 'multiple',
        choices: ['Track orders', 'Approve requests', 'Report on spend'],
      },
      { name: 'notes', prompt: 'Anything else we should know?', type: 'text' },
    ],
  });
  const [defaultAnswers] = ToolJet.useStateObject({
    name: 'defaultAnswers',
    label: 'Default answers',
    initialValue: {},
  });
  const [shortcuts] = ToolJet.useStateEnumeration({
    name: 'shortcuts',
    label: 'Shortcuts',
    enumDefinition: ['letters', 'numbers', 'none'],
    initialValue: 'letters',
  });
  const [showProgress] = ToolJet.useStateBoolean({ name: 'showProgress', label: 'Show progress', initialValue: true });
  const [submitLabel] = ToolJet.useStateString({ name: 'submitLabel', label: 'Submit label', initialValue: 'Submit' });
  const [completeTitle] = ToolJet.useStateString({
    name: 'completeTitle',
    label: 'Complete title',
    initialValue: 'Thank you',
  });
  const [completeText] = ToolJet.useStateString({
    name: 'completeText',
    label: 'Complete text',
    initialValue: 'Your answers were submitted.',
  });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: true });
  const [, setAnswersOut] = ToolJet.useStateObject({ name: 'answers', initialValue: {}, inspector: 'hidden' });
  const [currentIndex, setCurrentIndex] = ToolJet.useStateNumber({
    name: 'currentIndex',
    initialValue: 0,
    inspector: 'hidden',
  });
  const [, setCurrentItem] = ToolJet.useStateObject({ name: 'currentItem', initialValue: {}, inspector: 'hidden' });
  const [isComplete, setIsComplete] = ToolJet.useStateBoolean({
    name: 'isComplete',
    initialValue: false,
    inspector: 'hidden',
  });
  const onStepChanged = ToolJet.useEventCallback({ name: 'onStepChanged' });
  const onSubmit = ToolJet.useEventCallback({ name: 'onSubmit' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'questionnaire',
    fit: false,
    loading: 'own',
    usage:
      'One question at a time: items [{name, prompt, type: single|multiple|text, choices, other?, required?}], defaultAnswers, shortcuts, showProgress, submitLabel, completeTitle, completeText. answers, currentIndex, isComplete exposed; onStepChanged, onSubmit; actions reset, goTo.',
    roleProps: { surface: 'bordered' },
    roleValues: { bordered: { card: '{{true}}', plain: '{{false}}' } },
    defaultWidth: 24,
    defaultHeight: 50,
  });
  const questions = useMemo(() => normalizeItems(items), [items]);
  const seed = JSON.stringify([items, defaultAnswers]);
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(questions, defaultAnswers));
  const [error, setError] = useState('');
  useEffect(() => {
    setAnswers(initialAnswers(questions, defaultAnswers));
    setCurrentIndex(0);
    setIsComplete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  const index = Math.max(0, Math.min(questions.length - 1, Number(currentIndex) || 0));
  const item = questions[index];
  useEffect(() => {
    setAnswersOut(answersOf(questions, answers) as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions]);
  useEffect(() => {
    setCurrentItem(item ? ({ name: item.name, prompt: item.prompt, type: item.type } as Record<string, unknown>) : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // goTo and reset to the question already shown change nothing and fire nothing (lib/sameValue); a step from the
  // buttons fires as before.
  const indexSetter = useValueSetter<number>(index, (i) => setCurrentIndex(i));
  const go = (to: number, fromAction = false) => {
    setError('');
    if (!indexSetter.set(Math.max(0, Math.min(questions.length - 1, to))) && fromAction) return;
    onStepChanged();
  };
  // A step taken from the buttons puts focus in the new question once it is drawn, as shadcn's does; goTo and reset,
  // actions, leave focus where it is.
  const quizRef = useRef<HTMLDivElement>(null);
  const focusTo = useRef<number | null>(null);
  const focusFirst = () => {
    const root = quizRef.current;
    const el = root?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled])') ?? root;
    el?.focus();
  };
  useEffect(() => {
    const wanted = focusTo.current;
    focusTo.current = null;
    if (wanted === index) focusFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  const step = (to: number) => {
    const target = Math.max(0, Math.min(questions.length - 1, to));
    focusTo.current = target === index ? null : target;
    go(to);
  };
  const next = () => {
    if (!item) return;
    const why = problem(item, answers[item.name]);
    if (why) {
      setError(why);
      focusFirst();
      return;
    }
    if (index < questions.length - 1) return step(index + 1);
    const blocked = firstProblem(questions, answers);
    if (blocked >= 0) return step(blocked);
    setIsComplete(true);
    onSubmit();
  };
  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, () => {
    setAnswers(initialAnswers(questions, defaultAnswers));
    setIsComplete(false);
    go(0, true);
  });
  ToolJet.useAction(
    { name: 'goTo', displayName: 'Go to', params: [{ handle: 'item', displayName: 'Position or name' }] },
    (arg) => {
      const i = resolveIndex(arg, questions);
      if (i !== null) go(i, true);
    }
  );

  const answer = item ? answers[item.name] : undefined;
  const set = (a: Answers[string]) => {
    if (!item) return;
    setError('');
    setAnswers((prev) => ({ ...prev, [item.name]: a }));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (
      !item ||
      !answer ||
      item.type === 'text' ||
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA'
    )
      return;
    if (e.key === 'Enter') return next();
    const i = keyIndex(e.key, shortcuts, item.choices.length);
    if (i >= 0) set(pick(item, answer, item.choices[i]!.value));
  };

  let body: React.ReactNode;
  if (!questions.length) body = <Typography.Text type="secondary">No questions</Typography.Text>;
  else if (isComplete) body = <Result status="success" title={completeTitle} subTitle={completeText} />;
  else if (item && answer) {
    const multiple = item.type === 'multiple';
    body = (
      <div ref={quizRef} className="tj-ant-quiz" tabIndex={0} onKeyDown={onKey}>
        {showProgress ? (
          <Progress percent={Math.round((index / questions.length) * 100)} showInfo={false} size="small" />
        ) : null}
        <Typography.Text type="secondary">
          {index + 1} / {questions.length}
        </Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0' }}>
          {item.prompt}
          {item.required ? <span className="tj-ant-required"> *</span> : null}
        </Typography.Title>
        {item.description ? <Typography.Paragraph type="secondary">{item.description}</Typography.Paragraph> : null}
        {item.type === 'text' ? (
          item.multiline ? (
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 8 }}
              value={answer.text}
              placeholder={item.placeholder}
              disabled={disabled}
              onChange={(e) => set({ ...answer, text: e.target.value })}
            />
          ) : (
            <Input
              value={answer.text}
              placeholder={item.placeholder}
              disabled={disabled}
              onChange={(e) => set({ ...answer, text: e.target.value })}
              onPressEnter={next}
            />
          )
        ) : (
          <div className="tj-ant-quiz-choices">
            {item.choices.map((c, i) => {
              const picked = isPicked(item, answer, c.value);
              const key = shortcutKey(i, shortcuts);
              return (
                <div
                  key={String(c.value)}
                  className={picked ? 'tj-ant-quiz-choice is-picked' : 'tj-ant-quiz-choice'}
                  onClick={() => !disabled && set(pick(item, answer, c.value))}
                >
                  {multiple ? <Checkbox checked={picked} /> : <Radio checked={picked} />}
                  <div className="tj-ant-quiz-label">
                    <span>{c.label}</span>
                    {c.description ? <Typography.Text type="secondary">{c.description}</Typography.Text> : null}
                  </div>
                  {key ? <span className="tj-ant-quiz-key">{key}</span> : null}
                </div>
              );
            })}
            {item.other ? (
              <div
                className={answer.otherOn ? 'tj-ant-quiz-choice is-picked' : 'tj-ant-quiz-choice'}
                onClick={() => !disabled && !answer.otherOn && set(pickOther(item, answer))}
              >
                {multiple ? <Checkbox checked={answer.otherOn} /> : <Radio checked={answer.otherOn} />}
                <div className="tj-ant-quiz-label">
                  {answer.otherOn ? (
                    <Input
                      size="small"
                      autoFocus
                      value={answer.other}
                      placeholder={item.other.placeholder || item.other.label}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => set({ ...answer, other: e.target.value })}
                    />
                  ) : (
                    <span>{item.other.label}</span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
        {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
        <div className="tj-ant-quiz-nav">
          <Button disabled={index === 0 || disabled} onClick={() => step(index - 1)}>
            Back
          </Button>
          <Button type="primary" loading={loading} disabled={disabled} onClick={next}>
            {index === questions.length - 1 ? submitLabel : 'Next'}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <AntProvider tokens={tokens} fill>
      <Card className="tj-ant-quiz-card" variant={bordered ? 'outlined' : 'borderless'}>
        {body}
      </Card>
    </AntProvider>
  );
};
