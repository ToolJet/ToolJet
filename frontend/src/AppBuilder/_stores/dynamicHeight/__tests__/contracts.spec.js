import { MODAL_TYPES, TABS_TYPES } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { CONTENT_KINDS, HEIGHT_CONTRACTS, heightContractOf } from '../contracts';

// Every field a contract may carry. A field outside this list is a typo the engine would silently ignore.
const CONTRACT_FIELDS = ['content', 'contentSlot', 'portal', 'followsExpansion', 'moduleRoot', 'measured', 'rowFit'];
const ROW_FITS = ['fitted', 'card', 'host'];

describe('dynamic height contracts', () => {
  it('[DynamicHeight-CONTRACT-001] lays out a Container and a Form as a grid of components', () => {
    expect(heightContractOf('Container')).toEqual({ content: 'grid' });
    expect(heightContractOf('Form')).toEqual({ content: 'grid' });
  });

  it('[DynamicHeight-CONTRACT-002] lays out Tabs, and its UI 2.0 skin, on the active tab', () => {
    for (const type of TABS_TYPES) {
      expect(heightContractOf(type)).toEqual({ content: 'grid', contentSlot: 'activeTab' });
    }
  });

  it('[DynamicHeight-CONTRACT-003] sizes a modal, and its UI 2.0 skin, without letting it push the canvas', () => {
    for (const type of MODAL_TYPES) {
      expect(heightContractOf(type)).toEqual({ content: 'grid', portal: true });
    }
  });

  it('[DynamicHeight-CONTRACT-004] lets an Accordion follow being opened and closed', () => {
    expect(heightContractOf('Accordion')).toEqual({ content: 'grid', followsExpansion: true });
  });

  it('[DynamicHeight-CONTRACT-005] marks the root of an embedded module', () => {
    expect(heightContractOf('ModuleContainer')).toEqual({ content: 'grid', moduleRoot: true });
  });

  it('[DynamicHeight-CONTRACT-006] stacks a List view by its rows and a FlexContainer by its flex layout', () => {
    expect(heightContractOf('Listview')).toEqual({ content: 'rows' });
    expect(heightContractOf('FlexContainer')).toEqual({ content: 'flex' });
  });

  it('[DynamicHeight-CONTRACT-010] lets a list that draws its own rows measure itself, and says how its rows fit', () => {
    // UI 2.0's List view: each row fits its components, never below the Row height.
    expect(heightContractOf('ShadListView')).toEqual({ content: 'rows', measured: true, rowFit: 'fitted' });
    // UI 2.0's Kanban: each card fits its components, leaving out what is hidden on it.
    expect(heightContractOf('ShadKanban')).toEqual({ content: 'rows', measured: true, rowFit: 'card' });
    // A component built with the SDK: its host sizes its rows (usePackHost), so only their components are placed.
    for (const type of ['PackComponent', 'LibraryComponent']) {
      expect(heightContractOf(type)).toEqual({ content: 'rows', measured: true, rowFit: 'host' });
    }
  });

  it('[DynamicHeight-CONTRACT-007] treats every other widget as a leaf that is only measured', () => {
    // ModuleViewer follows its module's root, Kanban and the legacy Modal have no Dynamic height.
    for (const type of ['Text', 'Table', 'ModuleViewer', 'Kanban', 'Modal', 'NotAWidget', undefined, null]) {
      expect(heightContractOf(type)).toBeNull();
    }
    // Object.prototype keys are not widget types.
    expect(heightContractOf('toString')).toBeNull();
    expect(heightContractOf('constructor')).toBeNull();
  });

  it('[DynamicHeight-CONTRACT-008] uses only known content kinds and fields', () => {
    expect(CONTENT_KINDS).toEqual(['grid', 'rows', 'flex']);
    for (const [type, contract] of Object.entries(HEIGHT_CONTRACTS)) {
      expect({ type, content: CONTENT_KINDS.includes(contract.content) }).toEqual({ type, content: true });
      expect({ type, unknown: Object.keys(contract).filter((field) => !CONTRACT_FIELDS.includes(field)) }).toEqual({
        type,
        unknown: [],
      });
      // How a row fits is only said for a list that measures itself: the native List view sizes from its rows.
      if ('rowFit' in contract) {
        const { content, measured, rowFit } = contract;
        expect({ type, knownFit: ROW_FITS.includes(rowFit), content, measured }).toEqual({
          type,
          knownFit: true,
          content: 'rows',
          measured: true,
        });
      }
    }
  });

  it('[DynamicHeight-CONTRACT-009] cannot be changed by a caller, since every widget of a type shares one contract', () => {
    expect(Object.isFrozen(HEIGHT_CONTRACTS)).toBe(true);
    for (const contract of Object.values(HEIGHT_CONTRACTS)) expect(Object.isFrozen(contract)).toBe(true);
  });
});
