// ToolJet UI 2.0 pack: conversation widgets (Widgets/Shadcn/ShadChat.jsx, ShadQuestionnaire.jsx). The Chat is the
// native Chat widget in the pack's look: the same properties, events, exposed values and actions (and the native
// style keys), so an app or an agent that knows the native Chat uses it unchanged. The Questionnaire is a data-driven
// multi-step form, one question at a time.
import {
  ARRAY,
  OBJECT,
  STRING,
  action,
  choice,
  code,
  colorStyle,
  select,
  shadConfig,
  sizeStyle,
  toggle,
} from './shadcnPackHelpers.js';

const TYPEFACES = [
  ['theme', 'Theme font'],
  ['sans', 'Sans serif'],
  ['serif', 'Serif'],
  ['display', 'Display serif'],
  ['mono', 'Monospace'],
];

// ---- Chat ------------------------------------------------------------------------------------------------------------

const INITIAL_CHAT = `{{[{ message: 'Hi! Ask me anything about your orders, invoices or deliveries.', messageId: 'welcome-1', timestamp: 'new Date().toISOString()', name: 'Assistant', avatar: '', type: 'response' }]}}`;
const MESSAGE = '{{{}}}';

export const shadChatConfig = shadConfig({
  name: 'ShadChat',
  displayName: 'Chat',
  description:
    "ToolJet UI 2.0 chat: the native Chat widget's properties, events, exposed values and actions in the pack's look. Message rows with an avatar (an image URL, else initials) and the sender's name; the user's turns sit on the right in an accent bubble, replies on the left with markdown (lists, tables, code). A new user turn moves near the top of the view and the reply grows below it; scrolled up, the view stays where the reader is and a Jump to latest button appears. loadingResponse shows a typing indicator, loadingHistory skeleton rows. A message is { message, type: 'message' (user) | 'response' | 'error', name, avatar, timestamp, messageId }. Wire onMessageSent to a query that reads components.<chat>.lastMessage.message and appends its answer with the appendHistory action ({ message, type: 'response' }), with setResponseLoading around it. Height: fixed (the messages scroll); give it 400 to 700px",
  defaultSize: { width: 15, height: 480 },
  properties: {
    chatTitle: code('Chat title', STRING, 'Chat'),
    initialChat: code('Initial chat', { type: 'array', element: { type: 'object' } }, [], {
      placeholder: "[{ message: 'Hi!', type: 'response', name: 'Assistant' }]",
    }),
    userName: code('User name', STRING, '{{globals.currentUser.firstName}}'),
    userAvatar: code('User avatar', STRING, ''),
    respondentName: code('Respondent name', STRING, 'Assistant'),
    respondentAvatar: code('Respondent avatar', STRING, ''),
    placeholder: code('Placeholder for input field', STRING, 'Ask me anything!'),
    emptyText: code('Empty chat text', STRING, 'Start the conversation'),
    disableInput: toggle('Disable input state', false),
    loadingHistory: toggle('History loading state', false),
    loadingResponse: toggle('Response loading state', false),
    enableClearHistoryButton: toggle('Enable clear history icon', true),
    enableDownloadHistoryButton: toggle('Enable download history icon', true),
    showAvatars: toggle('Show avatars', true),
    showTimestamps: toggle('Show timestamps', true),
  },
  defaults: {
    chatTitle: { value: 'Chat' },
    initialChat: { value: INITIAL_CHAT },
    userName: { value: '{{globals.currentUser.firstName}}' },
    userAvatar: { value: '' },
    respondentName: { value: 'Assistant' },
    respondentAvatar: { value: '' },
    placeholder: { value: 'Ask me anything!' },
    emptyText: { value: 'Start the conversation' },
    disableInput: { value: '{{false}}' },
    loadingHistory: { value: '{{false}}' },
    loadingResponse: { value: '{{false}}' },
    enableClearHistoryButton: { value: '{{true}}' },
    enableDownloadHistoryButton: { value: '{{true}}' },
    showAvatars: { value: '{{true}}' },
    showTimestamps: { value: '{{true}}' },
  },
  // The native Chat's style keys, so a native Chat's styles carry over; unset, each follows the app theme.
  styles: {
    containerBackgroundColor: colorStyle('Background'),
    borderColorContainer: colorStyle('Border'),
    borderRadius: sizeStyle('Border radius'),
    accentColorField: colorStyle('Accent (your messages, send button, focus)'),
    responseBubbleColor: colorStyle('Reply bubble background'),
    name: colorStyle('Name color'),
    message: colorStyle('Message text color'),
    timestamp: colorStyle('Timestamp color'),
    backgroundColorField: colorStyle('Input background'),
    borderColorField: colorStyle('Input border'),
    textColorField: colorStyle('Input text color'),
    sendIconColorField: colorStyle('Send icon color'),
  },
  events: {
    onMessageSent: { displayName: 'On message sent' },
    onClearHistory: { displayName: 'On history cleared' },
  },
  exposedVariables: {
    history: [],
    isHistoryLoading: false,
    isInputDisabled: false,
    isResponseLoading: false,
    lastMessage: {},
    lastResponse: {},
  },
  actions: [
    action('appendHistory', 'Append history', [['message', 'Message', MESSAGE, 'code']]),
    action('clearHistory', 'Clear history'),
    action('downloadChat', 'Download chat'),
    action('sendMessage', 'Send message', [['message', 'Message', MESSAGE, 'code']]),
    action('setError', 'Set error', [['error', 'Error', '', 'code']]),
    action('setHistory', 'Set history', [['history', 'History', '{{[]}}', 'code']]),
    action('setHistoryLoading', 'Set history loading', [['loading', 'Loading', '{{false}}', 'toggle']]),
    action('setInputDisable', 'Set input disable', [['disabled', 'Disabled', '{{false}}', 'toggle']]),
    action('setResponderAvatar', 'Set respondent avatar', [['avatar', 'Avatar', '', 'code']]),
    action('setResponseLoading', 'Set response loading', [['loading', 'Loading', '{{false}}', 'toggle']]),
    action('setUserAvatar', 'Set user avatar', [['avatar', 'Avatar', '', 'code']]),
    action('setVisibility', 'Set visibility', [['visible', 'Visible', '{{true}}', 'toggle']]),
  ],
});

// ---- Questionnaire ---------------------------------------------------------------------------------------------------

const ITEMS = `{{[
  { name: 'role', prompt: 'What best describes your role?', required: true, type: 'single', choices: [{ label: 'Operations', description: 'Run day-to-day work' }, { label: 'Finance' }, { label: 'Engineering' }], other: true },
  { name: 'goals', prompt: 'What do you want to get done first?', description: 'Pick all that apply.', type: 'multiple', choices: ['Track orders', 'Approve requests', 'Report on spend'] },
  { name: 'notes', prompt: 'Anything else we should know?', type: 'text', placeholder: 'Optional' }
]}}`;

export const shadQuestionnaireConfig = shadConfig({
  name: 'ShadQuestionnaire',
  displayName: 'Questionnaire',
  description:
    "ToolJet UI 2.0 multi-step questionnaire, one question at a time: a 'Question 2 of 5' progress bar, the prompt and description, answer cards with a letter (or number) shortcut, and Previous, Skip (optional questions), Next and Submit. items: [{ name, prompt, description, required, type: 'single' | 'multiple' | 'text', choices: ['Label'] or [{ label, value, description }], other: true or { label, placeholder } (a free-text Other answer), placeholder (text) }]. A required question blocks Next with an error until answered. Exposes answers ({ [name]: value, multiple as an array, Other as its text }), currentIndex, currentItem and isComplete; onStepChange on every move, onSubmit with the answers (run the save query there). After submit it shows completeTitle and completeText. Actions reset() and goTo(index or name). defaultAnswers restores saved answers. Height: grows with the question (about 440px for four choices, 160px plus 58px per choice)",
  defaultSize: { width: 20, height: 480 },
  withHeight: true,
  properties: {
    items: code('Items', ARRAY, [], {
      placeholder:
        "[{ name: 'role', prompt: 'Your role?', required: true, type: 'single', choices: ['Ops', 'Finance'] }]",
    }),
    defaultAnswers: code('Default answers', OBJECT, {}, { placeholder: "{ role: 'Finance' }" }),
    shortcuts: choice('Answer shortcuts', ['letters', 'numbers', 'none'], 'letters'),
    showProgress: toggle('Show progress', true),
    submitLabel: code('Submit button label', STRING, 'Submit'),
    completeTitle: code('Completed title', STRING, 'Thanks for your answers'),
    completeText: code('Completed text', STRING, ''),
    surface: choice('Surface', ['card', 'plain'], 'card'),
  },
  defaults: {
    items: { value: ITEMS },
    defaultAnswers: { value: '{{{}}}' },
    shortcuts: { value: 'letters' },
    showProgress: { value: '{{true}}' },
    submitLabel: { value: 'Submit' },
    completeTitle: { value: 'Thanks for your answers' },
    completeText: { value: 'We will use them to set up your workspace.' },
    surface: { value: 'card' },
  },
  styles: {
    accentColor: colorStyle('Accent (progress, selected answer, buttons)'),
    backgroundColor: colorStyle('Background'),
    borderColor: colorStyle('Border and answer card border'),
    titleColor: colorStyle('Question color'),
    textColor: colorStyle('Description and answer description color'),
    borderRadius: sizeStyle('Radius'),
    titleFontFamily: select('Question typeface', TYPEFACES, 'theme'),
  },
  styleDefaults: { titleFontFamily: { value: 'theme' } },
  events: {
    onStepChange: { displayName: 'On step change' },
    onSubmit: { displayName: 'On submit' },
  },
  exposedVariables: { answers: {}, currentIndex: 0, currentItem: {}, isComplete: false },
  actions: [action('reset', 'Reset'), action('goTo', 'Go to question', [['index', 'Index or name', '{{0}}', 'code']])],
});
