// Names the UI 2.0 widgets used before their names were settled (NAMING.md), and the name each one became. Apps saved
// with an old name are rewritten by the server's data migration (server/data-migrations/*RenameUi2PackNames.ts) and on
// import; normalizeLegacyNames below covers anything loaded without that (a restored version, a git pull).
// The server keeps its own copy (server/src/modules/apps/services/ui2-legacy-names.ts); a spec checks they agree.
//
// A rename maps an old name to the name that replaces it; where both names fired or held the same thing, only the
// replacement is left. An exposed value may map to a path ('lastCardMovement.card').

export type Ui2Renames = {
  events?: Record<string, string>;
  actions?: Record<string, string>;
  exposed?: Record<string, string>;
  properties?: Record<string, string>;
};

/** Applies to every UI 2.0 widget type: the older control actions. */
export const UI2_COMMON_RENAMES: Ui2Renames = {
  actions: { visibility: 'setVisibility', disable: 'setDisable', loading: 'setLoading' },
};

const CHART: Ui2Renames = { exposed: { clickedDatum: 'clickedDataPoint' } };
const PICKER: Ui2Renames = { events: { onChange: 'onSelect' }, actions: { clear: 'clearValue' } };

export const UI2_RENAMES: Record<string, Ui2Renames> = {
  ShadAreaChart: CHART,
  ShadBarChart: CHART,
  ShadComboChart: CHART,
  ShadFunnelChart: CHART,
  ShadHeatmapChart: CHART,
  ShadLineChart: CHART,
  ShadPieChart: CHART,
  ShadRadarChart: CHART,
  ShadRadialChart: CHART,
  ShadScatterChart: CHART,
  ShadBreadcrumb: { events: { onItemClick: 'onItemClicked' } },
  ShadButtonGroup: { exposed: { values: 'selected' } },
  ShadCalendar: { events: { onMonthChange: 'onMonthChanged' } },
  ShadCardGrid: { events: { onCardClick: 'onCardClicked' } },
  ShadCarousel: { events: { onSlideChange: 'onSlideChanged', onSlideClick: 'onSlideClicked' } },
  ShadCheckbox: { actions: { setChecked: 'setValue' } },
  ShadColorPicker: { exposed: { selectedColorHex: 'value', rgb: 'selectedColorRGB', rgba: 'selectedColorRGBA' } },
  ShadCombobox: { events: { onChange: 'onSelect' } },
  ShadDatePicker: {
    events: { onChange: 'onSelect' },
    actions: { setDate: 'setValue', clear: 'clearValue' },
    exposed: { selectedDate: 'value' },
  },
  ShadDateTimePicker: {
    ...PICKER,
    actions: { setDate: 'setValue', clear: 'clearValue' },
  },
  ShadEmpty: { events: { onAction: 'onActionClicked' } },
  ShadFileUpload: { actions: { clear: 'clearFiles' }, exposed: { files: 'file' } },
  ShadHero: { events: { onActionClick: 'onActionClicked', onSecondaryActionClick: 'onSecondaryActionClicked' } },
  ShadImage: { properties: { src: 'source', alt: 'alternativeText', fit: 'imageFit' } },
  ShadKanban: {
    events: { onCardClicked: 'onCardSelected' },
    actions: { updateCard: 'updateCardData' },
    exposed: {
      cards: 'updatedCardData',
      selectedCard: 'lastSelectedCard',
      lastMove: 'lastCardMovement',
      movedCard: 'lastCardMovement.card',
    },
  },
  ShadLink: { properties: { href: 'linkTarget', text: 'linkText', target: 'targetType' } },
  ShadListView: {
    events: { onRowClicked: 'onRecordClicked' },
    exposed: { selectedRow: 'selectedRecord', selectedRowId: 'selectedRecordId' },
  },
  ShadMap: {
    events: { onMapClick: 'onMapClicked', onShapeClick: 'onShapeClicked', onLocationPick: 'onLocationPicked' },
  },
  ShadMultiselect: { events: { onChange: 'onSelect' } },
  ShadNavigation: {
    events: { onSelect: 'onClick' },
    actions: { setActive: 'selectItem' },
    exposed: { activeItem: 'selectedItem' },
  },
  ShadPhoneInput: { actions: { setCountry: 'setCountryCode' } },
  ShadNumberInput: { actions: { setValue: 'setText' } },
  ShadProgressList: { events: { onItemClick: 'onItemClicked' } },
  ShadQuestionnaire: { events: { onStepChange: 'onStepChanged' } },
  ShadRadioGroup: { events: { onChange: 'onSelectionChange' } },
  ShadRecordList: {
    events: { onRowClicked: 'onItemClicked', onRecordClicked: 'onItemClicked' },
    exposed: {
      selectedRecord: 'selectedItem',
      selectedRow: 'selectedItem',
      selectedRecordId: 'selectedItemId',
      selectedRowId: 'selectedItemId',
    },
  },
  ShadSchedule: { events: { onBookingClick: 'onBookingClicked', onSlotClick: 'onSlotClicked' } },
  ShadSelect: { events: { onChange: 'onSelect' } },
  ShadSteps: { actions: { setDisabled: 'setDisable' }, properties: { schema: 'steps' } },
  ShadTable: { properties: { pageSize: 'rowsPerPage' } },
  ShadTags: { events: { onTagClick: 'onTagClicked' } },
  ShadTagsInput: {
    events: { onTagRemoved: 'onTagDeleted' },
    exposed: { tags: 'values', value: 'values', selectedTags: 'values' },
  },
  ShadTimePicker: { ...PICKER, actions: { setTime: 'setValue', clear: 'clearValue' } },
  ShadTimeline: { events: { onItemClick: 'onItemClicked' } },
  ShadToggleGroup: { exposed: { selected: 'value' } },
};

/** The renames for one widget type (its own plus the common ones), or null for a type that is not a UI 2.0 widget. */
export const renamesFor = (type: string): Required<Ui2Renames> | null => {
  if (!type || !type.startsWith('Shad')) return null;
  const own = UI2_RENAMES[type] ?? {};
  return {
    events: { ...own.events },
    actions: { ...UI2_COMMON_RENAMES.actions, ...own.actions },
    exposed: { ...own.exposed },
    properties: { ...own.properties },
  };
};
