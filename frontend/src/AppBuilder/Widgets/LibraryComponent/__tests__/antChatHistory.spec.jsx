import React from 'react';
import { act, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-02: one click that ran two Ant Design Chat actions (Send message 'One', then Append to history 'Two') kept only
// 'Two', in the chat and in its exposed history; two Append to history kept only the second. An Ant Button's click runs
// its actions one after the other before the chat draws again, and each action built the new history from the one the
// chat last drew, so the second overwrote the first. The pack's Chat, the inline SDK and the host renderer are the real
// ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
const mount = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const actions = new Map();
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey="ant-chat-history"
      componentName="Chat"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={actions}
      host={makeHost('Chat', {})}
      dataCy={`chat-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="chat-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-ant-chat')).toBeTruthy());
  await waitFor(() => expect(actions.has('sendMessage') && actions.has('appendHistory')).toBe(true));
  return {
    exposed,
    actions,
    bubbles: () => [...root().querySelectorAll('.tj-ant-chat-bubble')].map((bubble) => bubble.textContent),
  };
};

const messagesOf = (history) => (Array.isArray(history) ? history.map((entry) => entry.message) : history);

describe('Ant Design Chat: actions run back to back', () => {
  test('[PackComponent-CHAT-001] Send message then Append to history keep both messages, in order', async () => {
    const chat = await mount({ initialChat: [] });

    // Both in one go, before the chat draws again: as one click runs its two actions.
    act(() => {
      chat.actions.get('sendMessage')('One');
      chat.actions.get('appendHistory')('Two');
    });

    expect(messagesOf(chat.exposed.history)).toEqual(['One', 'Two']);
    await waitFor(() => expect(chat.bubbles()).toEqual(['One', 'Two']));
  });

  test('[PackComponent-CHAT-002] two Append to history keep both messages, in order', async () => {
    const chat = await mount({ initialChat: [] });

    act(() => {
      chat.actions.get('appendHistory')('A');
      chat.actions.get('appendHistory')('B');
    });

    expect(messagesOf(chat.exposed.history)).toEqual(['A', 'B']);
    await waitFor(() => expect(chat.bubbles()).toEqual(['A', 'B']));
  });
});
