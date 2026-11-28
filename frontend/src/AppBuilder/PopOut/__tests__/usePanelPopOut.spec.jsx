import React, { useState } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import {
  PopOutPanel,
  PopOutSlot,
  focusPanelWindow,
  focusedPanelBody,
  usePanelPopOut,
  usePanelWindow,
  usePopOutControls,
  usePortalContainer,
} from '..';
import { readPanelPreference, writePanelPreference } from '../popOutPreferences';
import { setUserActivation, stubWindowOpen } from '@/test/panelWindow';

jest.mock('@/_services', () => ({
  authenticationService: { currentSessionValue: { current_user: { id: 'user-1' } } },
}));

let windows;
let latest;
let seen;

// What a panel reads about its window, written out so a spec can read it from whichever document it is in.
const Content = () => {
  const panelWindow = usePanelWindow();
  const container = usePortalContainer();
  const controls = usePopOutControls();
  const [typed, setTyped] = useState('');
  seen = { panelWindow, container, controls };
  return (
    <div data-testid="content">
      <input aria-label="Name" value={typed} onChange={(e) => setTyped(e.target.value)} />
      <button type="button" onClick={controls.popOut}>
        Pop out
      </button>
      <button type="button" onClick={controls.dock}>
        Dock
      </button>
    </div>
  );
};

const BodyPanel = (props) => {
  const popOut = usePanelPopOut({ id: 'code', title: 'Code', dockTo: 'body', ...props });
  latest = popOut;
  return (
    <PopOutPanel popOut={popOut}>
      <Content />
    </PopOutPanel>
  );
};

const SlotPanel = ({ showSlot = true, ...props }) => {
  const popOut = usePanelPopOut({ id: 'properties', title: 'Properties', ...props });
  latest = popOut;
  return (
    <>
      <div data-testid="sidebar">{showSlot && <PopOutSlot popOut={popOut} />}</div>
      <PopOutPanel popOut={popOut}>
        <Content />
      </PopOutPanel>
    </>
  );
};

const panelWindow = () => windows.opened[windows.opened.length - 1];
const inWindow = () => within(panelWindow().document.body);
const popOut = () => {
  let opened;
  act(() => {
    opened = latest.open();
  });
  return opened;
};

beforeEach(() => {
  localStorage.clear();
  windows = stubWindowOpen();
  setUserActivation(false);
});

afterEach(() => {
  windows.restore();
  document.head.replaceChildren();
});

describe('a docked panel', () => {
  it('renders in the editor, and reads the editor window', () => {
    render(<BodyPanel />);
    expect(screen.getByTestId('content').ownerDocument).toBe(document);
    expect(seen.panelWindow).toBe(window);
    expect(seen.container).toBeUndefined();
    expect(seen.controls).toMatchObject({ available: true, isPoppedOut: false });
  });

  it('does not offer to pop out where it is turned off', () => {
    render(<BodyPanel enabled={false} />);
    expect(seen.controls.available).toBe(false);
    expect(popOut()).toBe(false);
    expect(windows.open).not.toHaveBeenCalled();
  });
});

describe('popping a panel out', () => {
  it('opens a separate window and shows the panel there', () => {
    render(<BodyPanel />);
    popOut();

    expect(windows.open).toHaveBeenCalledWith(
      '',
      expect.stringMatching(/^tj-panel-code-/),
      'popup=yes,width=960,height=760'
    );
    expect(inWindow().getByTestId('content')).toBeTruthy();
    expect(screen.queryByTestId('content')).toBeNull();
    expect(panelWindow().document.title).toBe('Code');
  });

  it('moves the panel as it is: what was typed is still there, and typing still works', () => {
    render(<BodyPanel />);
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'kept' } });

    popOut();

    expect(inWindow().getByLabelText('Name')).toBe(input);
    expect(input.value).toBe('kept');
    fireEvent.change(input, { target: { value: 'kept and more' } });
    expect(input.value).toBe('kept and more');
  });

  it('tells the panel which window it is in and where its overlays go', () => {
    render(<BodyPanel />);
    popOut();
    expect(seen.panelWindow).toBe(panelWindow());
    expect(seen.container).toBe(panelWindow().document.body);
    expect(seen.controls.isPoppedOut).toBe(true);
  });

  it("gives the window the editor's stylesheets", () => {
    const style = document.createElement('style');
    style.textContent = '.code-panel { color: red; }';
    document.head.appendChild(style);
    render(<BodyPanel />);
    popOut();
    expect(panelWindow().document.head.querySelector('style').textContent).toBe('.code-panel { color: red; }');
  });

  it('wraps the panel in its scope, and follows a change of scope', () => {
    const { rerender } = render(<BodyPanel scope={['wrapper editor', 'editor-sidebar']} />);
    popOut();
    const host = inWindow().getByTestId('content').parentElement;
    expect(host.className).toContain('tj-popout-host--window');
    expect(host.parentElement.className).toBe('tj-popout-scope editor-sidebar');
    expect(host.parentElement.parentElement.className).toBe('tj-popout-scope wrapper editor');

    rerender(<BodyPanel scope={['wrapper editor', 'editor-sidebar theme-dark']} />);
    expect(host.parentElement.className).toBe('tj-popout-scope editor-sidebar theme-dark');
  });

  it('follows a change of title', () => {
    const { rerender } = render(<BodyPanel title="Code · Orders" />);
    popOut();
    rerender(<BodyPanel title="Code · Invoices" />);
    expect(panelWindow().document.title).toBe('Code · Invoices');
  });

  it('brings the window to the front instead of opening a second one', () => {
    render(<BodyPanel />);
    popOut();
    popOut();
    expect(windows.open).toHaveBeenCalledTimes(1);
    expect(panelWindow().focus).toHaveBeenCalled();
  });

  it('stays docked and says so when the browser blocks the window', () => {
    const onBlocked = jest.fn();
    render(<BodyPanel onBlocked={onBlocked} />);
    windows.block();

    expect(popOut()).toBe(false);

    expect(onBlocked).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('content')).toBeTruthy();
    expect(latest.isPoppedOut).toBe(false);
    expect(readPanelPreference('code').poppedOut).toBe(false);
  });

  it("works from the panel's own button", () => {
    render(<BodyPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Pop out' }));
    expect(inWindow().getByTestId('content')).toBeTruthy();
  });
});

describe('docking a panel back', () => {
  it('returns the panel to the editor when its window is closed, as it was', () => {
    const onDocked = jest.fn();
    render(<BodyPanel onDocked={onDocked} />);
    const input = screen.getByLabelText('Name');
    popOut();
    fireEvent.change(input, { target: { value: 'typed in the window' } });

    act(() => panelWindow().close());

    expect(screen.getByLabelText('Name')).toBe(input);
    expect(input.value).toBe('typed in the window');
    expect(input.ownerDocument).toBe(document);
    expect(screen.getByTestId('content').parentElement.className).toBe('tj-popout-host');
    expect(onDocked).toHaveBeenCalledWith({ byUser: true });
    expect(seen.panelWindow).toBe(window);
    expect(seen.container).toBeUndefined();
  });

  it("closes the window from the panel's own button", () => {
    render(<BodyPanel />);
    popOut();
    const win = panelWindow();
    fireEvent.click(inWindow().getByRole('button', { name: 'Dock' }));
    expect(win.close).toHaveBeenCalled();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('brings the panel back when the window is gone without saying so', () => {
    jest.useFakeTimers();
    render(<BodyPanel />);
    popOut();
    Object.defineProperty(panelWindow(), 'closed', { configurable: true, get: () => true });

    act(() => jest.advanceTimersByTime(600));

    expect(screen.getByTestId('content')).toBeTruthy();
    jest.useRealTimers();
  });

  it('closes the window when the editor page goes away', () => {
    render(<BodyPanel />);
    popOut();
    const win = panelWindow();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(win.close).toHaveBeenCalled();
  });

  it('closes the window when the panel itself goes away', () => {
    const { unmount } = render(<BodyPanel />);
    popOut();
    const win = panelWindow();
    unmount();
    expect(win.close).toHaveBeenCalled();
    expect(document.querySelector('.tj-popout-host')).toBeNull();
  });
});

describe('a panel with a place in the layout', () => {
  it('sits in its slot while docked, and goes back to it', () => {
    render(<SlotPanel />);
    const slot = screen.getByTestId('sidebar').firstElementChild;
    expect(slot.contains(screen.getByTestId('content'))).toBe(true);

    popOut();
    expect(slot.childNodes).toHaveLength(0);

    act(() => panelWindow().close());
    expect(slot.contains(screen.getByTestId('content'))).toBe(true);
  });

  it('keeps showing in its window when its place in the editor is gone', () => {
    const { rerender } = render(<SlotPanel />);
    popOut();
    rerender(<SlotPanel showSlot={false} />);
    expect(inWindow().getByTestId('content')).toBeTruthy();
  });

  it('takes its place once there is one again after its window closed', () => {
    const { rerender } = render(<SlotPanel />);
    const input = screen.getByLabelText('Name');
    popOut();
    rerender(<SlotPanel showSlot={false} />);

    act(() => panelWindow().close());
    expect(screen.queryByTestId('content')).toBeNull();

    rerender(<SlotPanel />);
    expect(screen.getByLabelText('Name')).toBe(input);
  });
});

describe("what is remembered for the user's next visit", () => {
  it('remembers a panel left in its window', () => {
    render(<BodyPanel />);
    popOut();
    expect(readPanelPreference('code').poppedOut).toBe(true);
    expect(latest.prefersWindow).toBe(true);
  });

  it('remembers docking it back', () => {
    render(<BodyPanel />);
    popOut();
    act(() => latest.dock());
    expect(readPanelPreference('code').poppedOut).toBe(false);
    expect(latest.prefersWindow).toBe(false);
  });

  it('still prefers the window after the editor page went away with the panel in it', () => {
    render(<BodyPanel />);
    popOut();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(readPanelPreference('code').poppedOut).toBe(true);
  });

  it('still prefers the window after the panel was taken away with its window open', () => {
    const { unmount } = render(<BodyPanel />);
    popOut();
    unmount();
    expect(readPanelPreference('code').poppedOut).toBe(true);
  });

  it('remembers where the window was, and opens it there the next time', () => {
    render(<BodyPanel />);
    popOut();
    Object.assign(panelWindow(), { innerWidth: 1100, innerHeight: 820, screenX: -1500, screenY: 40 });
    act(() => latest.dock());
    expect(readPanelPreference('code').bounds).toEqual({ width: 1100, height: 820, left: -1500, top: 40 });

    popOut();
    expect(windows.open).toHaveBeenLastCalledWith(
      '',
      expect.any(String),
      'popup=yes,width=1100,height=820,left=-1500,top=40'
    );
  });

  it('keeps each panel and each user apart', () => {
    writePanelPreference('properties', { poppedOut: true });
    expect(readPanelPreference('code').poppedOut).toBe(false);
    expect(Object.keys(localStorage)).toEqual(['tj:popout-panels:user-1']);
  });

  it('opens the window again for a user who had it out, once the browser allows it', () => {
    writePanelPreference('code', { poppedOut: true });
    render(<BodyPanel />);
    expect(latest.prefersWindow).toBe(true);

    // No click yet: the browser would block the window, so nothing is tried.
    act(() => {
      latest.restore();
    });
    expect(windows.open).not.toHaveBeenCalled();

    setUserActivation(true);
    act(() => {
      latest.restore();
    });
    expect(inWindow().getByTestId('content')).toBeTruthy();
  });

  it('leaves a docked panel docked', () => {
    setUserActivation(true);
    render(<BodyPanel />);
    act(() => {
      latest.restore();
    });
    expect(windows.open).not.toHaveBeenCalled();
  });

  it('keeps the choice of a window when the browser blocks the reopening, without complaining', () => {
    writePanelPreference('code', { poppedOut: true });
    setUserActivation(true);
    const onBlocked = jest.fn();
    render(<BodyPanel onBlocked={onBlocked} />);
    windows.block();
    act(() => {
      latest.restore();
    });
    expect(onBlocked).not.toHaveBeenCalled();
    expect(readPanelPreference('code').poppedOut).toBe(true);
  });
});

describe('reaching a panel window from elsewhere in the editor', () => {
  it('brings a popped-out panel to the front by its name', () => {
    render(<BodyPanel />);
    expect(focusPanelWindow('code')).toBe(false);
    popOut();
    expect(focusPanelWindow('code')).toBe(true);
    expect(panelWindow().focus).toHaveBeenCalled();
  });

  it('names the window the user is working in', () => {
    render(<BodyPanel />);
    expect(focusedPanelBody()).toBeUndefined();
    popOut();
    expect(focusedPanelBody()).toBeUndefined();
    panelWindow().document.hasFocus = () => true;
    expect(focusedPanelBody()).toBe(panelWindow().document.body);
  });
});
