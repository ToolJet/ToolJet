import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { FileUpload } from '../../../../../../../packs/shadcn/src/components/FileUpload';
import { parseDelimited } from '../../../../../../../packs/shadcn/src/lib/ui2/inputs/model';

// The shadcn pack FileUpload owns its file reads: a newer single choice, a clear or an unmount disowns older reads,
// pending reads hold their maxFiles place and see the live limit, and isParsing waits for every read (pack audit
// SP-11 to SP-17, 2026-10-23). The pack component, the inline SDK and the host renderer are the real ones; only the
// module and CSS loading is replaced, and FileReader is a controlled stand-in so tests choose which read ends first.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const CSV = 'name,value\nSynthetic,1';
let pending = [];
const RealFileReader = global.FileReader;
class ControlledFileReader {
  result = null;
  onload = null;
  onerror = null;
  onabort = null;
  readAsDataURL(file) {
    pending.push({ reader: this, file, kind: 'data' });
  }
  readAsText(file) {
    pending.push({ reader: this, file, kind: 'text' });
  }
  abort() {
    pending = pending.filter((p) => p.reader !== this);
    this.onabort?.();
  }
}

const step = async (name) => {
  const index = pending.findIndex((p) => p.file.name === name);
  if (index < 0) return false;
  const [{ reader, kind }] = pending.splice(index, 1);
  await act(async () => {
    reader.result = kind === 'data' ? 'data:text/csv;base64,bmFtZSx2YWx1ZQpTeW50aGV0aWMsMQ==' : CSV;
    reader.onload?.();
    await Promise.resolve();
  });
  return true;
};
// Runs a file's reads (data URL, then text) to the end, if they were started and not aborted.
const finish = async (name) => {
  while (await step(name));
};

const mount = async (props = {}) => {
  loadLibraryModule.mockResolvedValue({ FileUpload });
  const exposed = {};
  const events = [];
  const actions = new Map();
  const make = (extra) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="shad-file-upload"
      componentName="FileUpload"
      componentProps={{ accept: '.csv', multiple: true, maxFiles: 5, parseContent: true, ...props, ...extra }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(name) => events.push({ name, files: (exposed.file || []).map((f) => f.name) })}
      actions={actions}
      host={{
        disabled: false,
        loading: false,
        useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
      }}
      dataCy="pack-file"
    />
  );
  const view = render(make({}));
  const input = () =>
    view.container.querySelector('[data-cy="pack-file"]').shadowRoot?.querySelector('input[type=file]');
  await waitFor(() => expect(input()).toBeTruthy());
  const pick = (...names) =>
    fireEvent.change(input(), { target: { files: names.map((n) => new File([CSV], n, { type: 'text/csv' })) } });
  const names = () => (exposed.file || []).map((f) => f.name);
  const loaded = () => events.filter((e) => e.name === 'onFileLoaded');
  return { exposed, events, actions, pick, names, loaded, view, rerender: (extra) => view.rerender(make(extra)) };
};

describe('shadcn pack FileUpload read ownership', () => {
  beforeEach(() => {
    pending = [];
    global.FileReader = ControlledFileReader;
  });
  afterEach(() => {
    global.FileReader = RealFileReader;
  });

  it('SP-11: a newer single-file choice wins even when the older read finishes last', async () => {
    const t = await mount({ multiple: false });
    t.pick('slow-old.csv');
    t.pick('fast-new.csv');
    await finish('fast-new.csv');
    await finish('slow-old.csv');
    expect(t.names()).toEqual(['fast-new.csv']);
    expect(t.loaded().map((e) => e.files)).toEqual([['fast-new.csv']]);
  });

  it('sequential single-file replacement still replaces', async () => {
    const t = await mount({ multiple: false });
    t.pick('first.csv');
    await finish('first.csv');
    t.pick('second.csv');
    await finish('second.csv');
    expect(t.names()).toEqual(['second.csv']);
    expect(t.loaded().map((e) => e.files)).toEqual([['first.csv'], ['second.csv']]);
  });

  it('SP-12: isParsing stays true while another accepted read is pending', async () => {
    const t = await mount();
    t.pick('slow-pending.csv');
    t.pick('fast-parsed.csv');
    await finish('fast-parsed.csv');
    expect(t.exposed.isParsing).toBe(true);
    await finish('slow-pending.csv');
    expect(t.exposed.isParsing).toBe(false);
    expect(t.names()).toEqual(['fast-parsed.csv', 'slow-pending.csv']);
  });

  it('SP-13: a pending read holds its maxFiles place, so the next pick is not read', async () => {
    const t = await mount({ maxFiles: 1 });
    t.pick('slow-reserved.csv');
    t.pick('fast-overflow.csv');
    expect(pending.some((p) => p.file.name === 'fast-overflow.csv')).toBe(false);
    await finish('slow-reserved.csv');
    expect(t.names()).toEqual(['slow-reserved.csv']);
    expect(t.loaded()).toHaveLength(1);
  });

  it('SP-14: an in-flight batch obeys a maxFiles lowered before it finishes, and loads only what it kept', async () => {
    const t = await mount({ maxFiles: 2 });
    t.pick('cap-a.csv', 'cap-b.csv');
    t.rerender({ maxFiles: 1 });
    await finish('cap-a.csv');
    await finish('cap-b.csv');
    expect(t.names()).toEqual(['cap-a.csv']);
    expect(t.loaded()).toHaveLength(1);
    // A batch that adds nothing under the lowered limit fires no events.
    t.rerender({ maxFiles: 2 });
    t.pick('late.csv');
    t.rerender({ maxFiles: 1 });
    await finish('late.csv');
    expect(t.names()).toEqual(['cap-a.csv']);
    expect(t.loaded()).toHaveLength(1);
  });

  it('clearFiles wins over a pending read', async () => {
    const t = await mount();
    t.pick('slow-a.csv');
    act(() => t.actions.get('clearFiles')());
    await finish('slow-a.csv');
    expect(t.names()).toEqual([]);
    expect(t.exposed.isParsing).toBe(false);
    expect(t.loaded()).toHaveLength(0);
  });

  it('SP-17: unmount (a removed ListView row) aborts the read and publishes nothing', async () => {
    const t = await mount({ multiple: false });
    t.pick('slow-departed.csv');
    const before = t.events.length;
    t.view.unmount();
    expect(pending).toHaveLength(0);
    await finish('slow-departed.csv');
    expect(t.events.slice(before)).toEqual([]);
    expect(t.names()).toEqual([]);
  });

  it('SP-15: an xlsx under auto-detect says plainly that it was not parsed', async () => {
    const t = await mount({ accept: '.xlsx' });
    fireEvent.change(
      t.view.container.querySelector('[data-cy="pack-file"]').shadowRoot.querySelector('input[type=file]'),
      { target: { files: [new File(['PK'], 'book.xlsx', { type: '' })] } }
    );
    await finish('book.xlsx');
    expect(t.exposed.file[0].parsedData).toBeNull();
    expect(t.exposed.file[0].parseError).toMatch(/Excel files cannot be parsed/);
  });
});

describe('shadcn pack CSV parsing (SP-16)', () => {
  it('keeps ordinary columns without warnings', () => {
    const warnings = [];
    expect(parseDelimited(CSV, ',', warnings)).toEqual([{ name: 'Synthetic', value: '1' }]);
    expect(warnings).toEqual([]);
  });

  it('renames a repeated header instead of overwriting it', () => {
    const warnings = [];
    expect(parseDelimited('name,name\nLeft,Right', ',', warnings)).toEqual([{ name: 'Left', name_1: 'Right' }]);
    expect(warnings).toEqual(['duplicate headers renamed: name to name_1']);
  });

  it('reports rows with too few or too many fields and keeps the extras', () => {
    const warnings = [];
    expect(parseDelimited('name,value\nShort\nSynthetic,1,Extra', ',', warnings)).toEqual([
      { name: 'Short', value: '' },
      { name: 'Synthetic', value: '1', __parsed_extra: ['Extra'] },
    ]);
    expect(warnings).toEqual([
      'row 1: Too few fields: expected 2 fields but parsed 1',
      'row 2: Too many fields: expected 2 fields but parsed 3',
    ]);
  });

  it('bounds the row diagnostics of a large malformed file', () => {
    const warnings = [];
    parseDelimited(['a,b', ...Array.from({ length: 50 }, () => 'x')].join('\n'), ',', warnings);
    expect(warnings).toHaveLength(4);
    expect(warnings[3]).toBe('(47 more rows with the wrong number of fields)');
  });

  it('surfaces the diagnostics in parseError of the uploaded file', async () => {
    pending = [];
    global.FileReader = ControlledFileReader;
    try {
      const t = await mount();
      t.pick('dupes.csv');
      // The data URL read ends as usual; the text read returns duplicate-header content instead of the stand-in's CSV.
      await step('dupes.csv');
      const [{ reader }] = pending.splice(0, 1);
      await act(async () => {
        reader.result = 'name,name\nLeft,Right';
        reader.onload?.();
        await Promise.resolve();
      });
      expect(t.exposed.file[0].parsedData).toEqual([{ name: 'Left', name_1: 'Right' }]);
      expect(t.exposed.file[0].parseError).toBe('"dupes.csv": duplicate headers renamed: name to name_1');
    } finally {
      global.FileReader = RealFileReader;
    }
  });
});
