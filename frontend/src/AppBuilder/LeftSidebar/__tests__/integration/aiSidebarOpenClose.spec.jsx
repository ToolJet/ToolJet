/**
 * AI sidebar open/close, with the real enterprise rail item and chat: the "AI chat" rail item
 * opens the AI chat in the left panel, and the chat goes away from its own close button or from a
 * second click on the rail item. The community edition has no AI rail item, so these are skipped there.
 */
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { act, screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { LeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render, userEvent } from '@/test/test-utils';

const API = 'http://localhost:3000/api';
const controls = createAppBuilderControls();
const state = () => useStore.getState();
const leftPanel = () => ({ item: state().selectedSidebarItem, open: state().isSidebarOpen });
const eeTest = process.env.TOOLJET_EDITION === 'ce' ? test.skip : test;
const publicConfig = window.public_config;

const aiRailItem = () => screen.getByRole('button', { name: 'AI chat' });
const chatPanel = () => screen.queryByRole('dialog');
const openChat = async (user) => {
  await user.click(aiRailItem());
  return within(await screen.findByRole('dialog')).findByRole('button', { name: 'Close AI chat' });
};

beforeEach(() => {
  controls.observers.install();
  controls.geometry.textRange();
  // The server injects this at boot; the chat's "build from your editor" links read the host from it.
  window.public_config = { TOOLJET_HOST: 'http://localhost:3000' };
  // jsdom has no layout, so it does not implement the scroll the conversation does on mount.
  Element.prototype.scrollIntoView = () => {};
  server.use(
    http.get(`${API}/ai/llm-preference`, () => HttpResponse.json({})),
    http.get(`${API}/ai/taggable-datasources`, () => HttpResponse.json([])),
    http.get(`${API}/app-environments`, () => HttpResponse.json({ environments: [] }))
  );
  act(() => {
    state().setCurrentMode('edit', 'canvas');
    state().toggleLeftSidebar(false);
  });
  render(<LeftSidebar />);
});

afterEach(() => {
  controls.restore();
  window.public_config = publicConfig;
  delete Element.prototype.scrollIntoView;
});

eeTest('the AI rail item opens the AI chat in the left panel', async () => {
  expect(chatPanel()).not.toBeInTheDocument();

  await openChat(userEvent.setup());

  expect(leftPanel()).toEqual({ item: 'tooljetai', open: true });
  expect(within(chatPanel()).getByRole('textbox')).toBeInTheDocument();
});

eeTest('the close button of the chat hides the chat', async () => {
  const user = userEvent.setup();

  await user.click(await openChat(user));

  expect(leftPanel()).toEqual({ item: null, open: false });
  await waitFor(() => expect(chatPanel()).not.toBeInTheDocument());
});

eeTest('clicking the AI rail item again hides the chat', async () => {
  const user = userEvent.setup();
  await openChat(user);

  await user.click(aiRailItem());

  expect(leftPanel()).toEqual({ item: null, open: false });
  await waitFor(() => expect(chatPanel()).not.toBeInTheDocument());
});
