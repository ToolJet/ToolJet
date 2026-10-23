/**
 * UI 2.0 Key-value list copy and formats (release audit round 2, after Codex's reviewKeyValueClipboardFailure,
 * reviewKeyValueCopyKeyboard and reviewKeyValueFormatRecovery fixtures): the copy button says Copied only once the
 * clipboard took the text, and says when it did not; Enter and Space on it copy even when its row takes clicks; and a
 * locale or currency Intl cannot use does not blank the values. Titles carry [ShadKeyValue-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadKeyValue',
  handle: 'facts1',
  id: 'facts1',
  widgetHeight: 400,
  widgetWidth: 500,
});
const ONE_ROW = binding('{{[{label:"Customer",value:"Ada"}]}}');
let previous;
const useClipboard = (writeText) =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: writeText ? { writeText } : undefined });

describe('UI 2.0 Key-value copy', () => {
  beforeEach(() => {
    widget.setup();
    previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  });
  afterEach(() => {
    widget.teardown();
    if (previous) Object.defineProperty(navigator, 'clipboard', previous);
    else delete navigator.clipboard;
    jest.restoreAllMocks();
  });

  test.each(['success', 'missing', 'throws', 'pending', 'rejected'])(
    '[ShadKeyValue-COPY-001] with the clipboard %s, Copied shows only once the copy succeeded',
    async (mode) => {
      const failed = jest.spyOn(toast, 'error').mockImplementation(() => {});
      let finish;
      const pending = new Promise((resolve) => {
        finish = resolve;
      });
      useClipboard(
        mode === 'missing'
          ? null
          : jest.fn(() => {
              if (mode === 'throws') throw new Error('denied');
              if (mode === 'pending') return pending;
              if (mode === 'rejected') return Promise.reject(new Error('denied'));
              return Promise.resolve();
            })
      );
      widget.render({ currentMode: 'view', properties: { data: ONE_ROW, allowCopy: binding('{{true}}') } });
      const copy = await screen.findByRole('button', { name: 'Copy value' });
      await act(async () => fireEvent.click(copy));
      const copied = () => copy.querySelector('svg.lucide-check') !== null;
      expect(copied()).toBe(mode === 'success');
      expect(failed).toHaveBeenCalledTimes(['missing', 'throws', 'rejected'].includes(mode) ? 1 : 0);
      if (mode === 'pending') {
        await act(async () => finish());
        expect(copied()).toBe(true);
      }
    }
  );

  test.each([false, true].flatMap((rowClicks) => ['click', 'Enter', 'Space'].map((how) => [rowClicks, how])))(
    '[ShadKeyValue-COPY-002] with row clicks %s, %s on the copy button copies once and leaves the row alone',
    async (rowClicks, how) => {
      const user = userEvent.setup();
      const writeText = jest.fn().mockResolvedValue(undefined);
      useClipboard(writeText);
      widget.render({ currentMode: 'view', properties: { data: ONE_ROW, allowCopy: binding('{{true}}') } });
      if (rowClicks) widget.setEvents(setVariableOn('facts1', 'onFieldClick', { key: 'rowClicks', value: 'yes' }));
      const copy = await screen.findByRole('button', { name: 'Copy value' });
      if (how === 'click') await user.click(copy);
      else {
        await act(async () => copy.focus());
        await user.keyboard(how === 'Enter' ? '{Enter}' : ' ');
      }
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith('Ada');
      expect(widget.variables().rowClicks).toBeUndefined();
    }
  );
});

describe('UI 2.0 Key-value formats Intl cannot use', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);
  const data = binding(
    '{{[{label:"Amount",value:1250,type:"currency"},{label:"Zero",value:0,type:"number"},{label:"False",value:false,type:"boolean"}]}}'
  );
  const value = (label) => screen.getByText(label, { selector: 'dt' }).nextSibling.textContent;

  test.each([
    ['locale', { locale: binding('not_a_locale') }],
    ['currency', { currency: binding('INVALID') }],
  ])('[ShadKeyValue-FMT-001] an unusable %s still shows every value', async (_, extra) => {
    widget.render({
      currentMode: 'view',
      properties: { data, currency: binding('USD'), locale: binding('en-US'), ...extra },
    });
    await screen.findByText('Amount', { selector: 'dt' });
    expect(value('Amount')).toMatch(/1,250/);
    expect(value('Zero')).toBe('0');
    expect(value('False')).toBe('No');
  });
});
