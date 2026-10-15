/**
 * The canvas build overlay ships with the AI builder (ee). Without it (a CE build, where @ee resolves to an
 * empty module) the core overlay must keep its plain card and the blank canvas its old cards, rather than
 * crash on a missing component. Run under both editions: `npx jest` and `TOOLJET_EDITION=ce npx jest`.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import AgentBuildingOverlay from '../AgentBuildingOverlay';

let mockState;
jest.mock('@/AppBuilder/_stores/store', () => {
  const useStore = (selector) => selector(mockState);
  useStore.getState = () => mockState;
  return { __esModule: true, default: useStore };
});

const isCe = process.env.TOOLJET_EDITION === 'ce';

const building = (isLoading) => ({
  ai: {
    isLoading,
    currentConversation: 'generate',
    conversation: { aiConversationMessages: [], metadata: {} },
    liveTrail: null,
    turnIsEdit: false,
    turnChangesLanded: 0,
    connectionLost: false,
    buildPlan: null,
    turnStartedAt: Date.now(),
    reattachStartedAt: null,
  },
  appStore: { modules: { canvas: { app: { appName: 'Clinic' } } } },
  getCurrentPageComponents: () => ({}),
  dataQuery: { queries: { modules: { canvas: [] } } },
});

describe(`AgentBuildingOverlay (${isCe ? 'CE' : 'EE'})`, () => {
  it('renders nothing when no build is running', () => {
    mockState = building(false);
    const { container } = render(<AgentBuildingOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it('covers the canvas while a build runs, with the edition’s own view', () => {
    mockState = building(true);
    render(<AgentBuildingOverlay />);
    expect(document.querySelector('[data-cy="agent-building-overlay"]')).toBeTruthy();
    if (isCe) {
      expect(screen.getByText('Agent is building your app')).toBeInTheDocument();
    } else {
      expect(screen.getByText('Understanding your data')).toBeInTheDocument();
      expect(screen.getByText('Your page fills in here as each change lands.')).toBeInTheDocument();
    }
  });
});
