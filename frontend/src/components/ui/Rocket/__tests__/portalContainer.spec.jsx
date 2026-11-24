import React from 'react';
import { act, render, within } from '@testing-library/react';
import { createPanelWindow } from '@/test/panelWindow';
import { PanelWindowContext } from '@/AppBuilder/PopOut/PanelWindowContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Rocket/Tooltip/Tooltip';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/Rocket/Sheet/Sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/Rocket/AlertDialog/AlertDialog';
import * as ShadcnPopover from '@/components/ui/Rocket/shadcn/popover';
import * as ShadcnTooltip from '@/components/ui/Rocket/shadcn/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/shadcn/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Rocket/shadcn/select';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/Rocket/shadcn/combobox';

let panelWindow;

// What a panel in its own window gives everything rendered in it.
const InPanelWindow = ({ children }) => (
  <PanelWindowContext.Provider value={{ window: panelWindow, portalContainer: panelWindow.document.body }}>
    {children}
  </PanelWindowContext.Provider>
);

// Each wrapper, already open, with a text that only its portalled content has. Dialog, Sheet and AlertDialog go
// through the shadcn portals, as do the Rocket menu, select and combobox through the shadcn contents below.
const overlays = [
  [
    'Popover',
    'Filter by owner',
    <Popover key="popover" open>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent>Filter by owner</PopoverContent>
    </Popover>,
  ],
  [
    'Tooltip',
    'Runs the query',
    <TooltipProvider key="tooltip">
      <Tooltip open>
        <TooltipTrigger>Run</TooltipTrigger>
        <TooltipContent>Runs the query</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  ],
  [
    'Dialog',
    'Rename the page',
    <Dialog key="dialog" open>
      <DialogContent>
        <DialogTitle>Rename the page</DialogTitle>
        <DialogDescription>Pick a new name</DialogDescription>
      </DialogContent>
    </Dialog>,
  ],
  [
    'Sheet',
    'Page settings',
    <Sheet key="sheet" open>
      <SheetContent>
        <SheetTitle>Page settings</SheetTitle>
        <SheetDescription>For this page only</SheetDescription>
      </SheetContent>
    </Sheet>,
  ],
  [
    'AlertDialog',
    'Delete the page?',
    <AlertDialog key="alert-dialog" open>
      <AlertDialogContent>
        <AlertDialogTitle>Delete the page?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone</AlertDialogDescription>
      </AlertDialogContent>
    </AlertDialog>,
  ],
  [
    'shadcn popover',
    'Sort by name',
    <ShadcnPopover.Popover key="shadcn-popover" open>
      <ShadcnPopover.PopoverTrigger>Sort</ShadcnPopover.PopoverTrigger>
      <ShadcnPopover.PopoverContent>Sort by name</ShadcnPopover.PopoverContent>
    </ShadcnPopover.Popover>,
  ],
  [
    'shadcn tooltip',
    'Stops the query',
    <ShadcnTooltip.TooltipProvider key="shadcn-tooltip">
      <ShadcnTooltip.Tooltip open>
        <ShadcnTooltip.TooltipTrigger>Stop</ShadcnTooltip.TooltipTrigger>
        <ShadcnTooltip.TooltipContent>Stops the query</ShadcnTooltip.TooltipContent>
      </ShadcnTooltip.Tooltip>
    </ShadcnTooltip.TooltipProvider>,
  ],
  [
    'shadcn dropdown menu',
    'Duplicate',
    <DropdownMenu key="dropdown-menu" open>
      <DropdownMenuTrigger>More</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  ],
  [
    'shadcn dropdown submenu',
    'To another page',
    <DropdownMenu key="dropdown-submenu" open>
      <DropdownMenuTrigger>More</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub open>
          <DropdownMenuSubTrigger>Move</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>To another page</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  ],
  [
    'shadcn select',
    'Right',
    <Select key="select" open value="left">
      <SelectTrigger aria-label="Align">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Left</SelectItem>
        <SelectItem value="right">Right</SelectItem>
      </SelectContent>
    </Select>,
  ],
  [
    'shadcn combobox',
    'Postgres',
    <Combobox key="combobox" open items={['Postgres', 'MySQL']}>
      <ComboboxInput aria-label="Data source" />
      <ComboboxContent>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  ],
];

// Counted, not found: a tooltip repeats its text for screen readers.
const countIn = (body, text) => within(body).queryAllByText(text).length;

// Overlays are placed a moment after they open; let that settle before reading the page.
const renderPlaced = async (ui) => {
  const view = render(ui);
  await act(async () => {});
  return view;
};

beforeAll(() => {
  // The primitives measure their anchor; jsdom has nothing to measure.
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Radix looks for a dialog's title and description in the editor's document. In a panel's window they are in that
// window's document, so it logs that they are missing when they are not. Everything else still reaches the console.
const LOOKED_IN_THE_WRONG_DOCUMENT = /requires a `\w+Title`|requires a description|Missing `Description`/;
const consoleSpies = [];

beforeEach(() => {
  for (const level of ['error', 'warn']) {
    const log = console[level];
    consoleSpies.push(
      jest.spyOn(console, level).mockImplementation((...args) => {
        if (!LOOKED_IN_THE_WRONG_DOCUMENT.test(String(args[0]))) log(...args);
      })
    );
  }
  panelWindow = createPanelWindow();
  // jsdom scrolls nothing, in either window (setupTests covers the editor's): a select scrolls to its chosen item.
  panelWindow.Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  consoleSpies.splice(0).forEach((spy) => spy.mockRestore());
  document.body.replaceChildren();
});

describe.each(overlays)('%s', (_name, text, ui) => {
  it("opens in the panel's window", async () => {
    await renderPlaced(<InPanelWindow>{ui}</InPanelWindow>);

    expect(countIn(panelWindow.document.body, text)).toBeGreaterThan(0);
    expect(countIn(document.body, text)).toBe(0);
  });

  it("opens in the editor's body outside a pop-out panel", async () => {
    const { container } = await renderPlaced(ui);

    expect(countIn(document.body, text)).toBeGreaterThan(0);
    expect(countIn(container, text)).toBe(0);
    expect(countIn(panelWindow.document.body, text)).toBe(0);
  });
});

describe('shadcn select', () => {
  it('keeps a container the caller chose', async () => {
    const own = document.body.appendChild(document.createElement('div'));
    await renderPlaced(
      <InPanelWindow>
        <Select open value="left">
          <SelectTrigger aria-label="Align">
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={own}>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </InPanelWindow>
    );

    expect(countIn(own, 'Right')).toBeGreaterThan(0);
    expect(countIn(panelWindow.document.body, 'Right')).toBe(0);
  });
});
