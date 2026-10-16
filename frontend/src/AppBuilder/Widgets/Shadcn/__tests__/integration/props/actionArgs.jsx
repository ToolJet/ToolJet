// How to call each action of each shadcn/ui pack widget (experiment) with valid arguments, and what it must change.
// actions.spec.jsx calls every one through the widget's exposed function (as a Control component action does) and
// checks the effect: by default, that what the widget shows or exposes changed. `before` steps (probes.jsx) set up
// the state the action needs (a value to clear, a point to un-click); `context` sets properties; `fires` names an
// event the action must fire instead of a visible change; `focus` checks where focus went. The standard actions
// (setVisibility, setDisable, setLoading) are checked for every widget in actions.spec.jsx itself.

const CLICKED_CHART = { before: [['chartClick']] };
const clearPoint = (before) => ({ clearClickedPoint: { args: [], before } });
const FOCUS_PAIR = {
  setFocus: { args: [], focus: true },
  setBlur: { args: [], before: [['action', 'setFocus']], focus: false },
};
const TEXT_ACTIONS = {
  setText: { args: ['Changed text'] },
  clear: { args: [], context: { defaultValue: 'Some text' } },
  ...FOCUS_PAIR,
};
const DATE = '2026-10-21';

export const ACTION_ARGS = {
  ShadAccordion: {
    expand: { args: [1] },
    collapse: { args: [0], context: { defaultOpen: '{{[0]}}' } },
  },
  ShadAreaChart: clearPoint(CLICKED_CHART.before),
  ShadBarChart: clearPoint(CLICKED_CHART.before),
  ShadLineChart: clearPoint(CLICKED_CHART.before),
  ShadComboChart: clearPoint(CLICKED_CHART.before),
  ShadRadarChart: clearPoint(CLICKED_CHART.before),
  ShadPieChart: clearPoint([['click', '.recharts-pie-sector path, .recharts-sector', 0]]),
  ShadRadialChart: {
    clearClickedPoint: {
      args: [],
      context: { mode: 'categories' },
      before: [['click', '.recharts-radial-bar-sector', 0]],
    },
  },
  ShadScatterChart: clearPoint([['click', '.recharts-symbols', 0]]),
  ShadFunnelChart: clearPoint([['click', 'button', 1]]),
  ShadHeatmapChart: clearPoint([['click', 'button', 1]]),
  ShadButton: {
    click: { args: [], fires: 'onClick' },
    setText: { args: ['Save draft'] },
  },
  ShadButtonGroup: { setSelected: { args: ['month'] }, clear: { args: [] } },
  ShadCalendar: {
    selectDate: { args: [DATE] },
    clear: { args: [], context: { defaultValue: DATE } },
    setMonth: { args: ['2027-03-01'] },
  },
  ShadCarousel: {
    next: { args: [] },
    previous: { args: [], before: [['action', 'next']] },
    goTo: { args: [2] },
  },
  ShadCheckbox: { toggle: { args: [] }, setValue: { args: [true] } },
  ShadSwitch: { toggle: { args: [] }, setValue: { args: [true] } },
  ShadCircularProgress: { setValue: { args: [12] } },
  ShadProgress: { setValue: { args: [12] } },
  ShadColorPicker: { setColor: { args: ['#16a34a'] }, ...FOCUS_PAIR },
  ShadCombobox: {
    selectOption: { args: ['uk'] },
    clear: { args: [], before: [['action', 'selectOption', 'uk']] },
    ...FOCUS_PAIR,
  },
  ShadMultiselect: {
    selectOptions: { args: [['sales']] },
    deselectOptions: { args: [['design']] },
    clear: { args: [] },
    ...FOCUS_PAIR,
  },
  ShadCurrencyInput: {
    setValue: { args: [99.5, 'EUR'] },
    setCurrency: { args: ['EUR'] },
    clear: { args: [] },
    ...FOCUS_PAIR,
  },
  ShadNumberInput: { setText: { args: ['78'] }, clear: { args: [] }, ...FOCUS_PAIR },
  ShadPasswordInput: { ...TEXT_ACTIONS },
  ShadInput: { ...TEXT_ACTIONS },
  ShadTextarea: { ...TEXT_ACTIONS },
  ShadPhoneInput: {
    setValue: { args: ['4155550123', 'US'] },
    setCountryCode: { args: ['FR'] },
    clear: { args: [], context: { defaultValue: '+14155550123' } },
    ...FOCUS_PAIR,
  },
  ShadOtpInput: {
    setText: { args: ['123456'] },
    clear: { args: [], context: { defaultValue: '123456' } },
    ...FOCUS_PAIR,
  },
  ShadDatePicker: {
    clearValue: { args: [], context: { defaultValue: DATE } },
    setValue: { args: ['21/10/2026', 'DD/MM/YYYY'] },
    setValueInTimestamp: { args: [new Date(2026, 9, 21).getTime()] },
    setStartDate: { args: [DATE], context: { mode: 'range' } },
    setEndDate: { args: ['2026-10-25'], context: { mode: 'range' } },
    setDateRange: { args: [DATE, '2026-10-25'], context: { mode: 'range' } },
    clearStartDate: { args: [], context: { mode: 'range', defaultValue: `{{['${DATE}', '2026-10-25']}}` } },
    clearEndDate: { args: [], context: { mode: 'range', defaultValue: `{{['${DATE}', '2026-10-25']}}` } },
    clearDateRange: { args: [], context: { mode: 'range', defaultValue: `{{['${DATE}', '2026-10-25']}}` } },
    // The bounds and disabled days show in the validation of a picked date (and in the calendar once open).
    setMinDate: { args: ['2026-11-01'], context: { defaultValue: DATE } },
    setMaxDate: { args: ['2026-10-01'], context: { defaultValue: DATE } },
    setDisabledDates: { args: [[DATE]], context: { defaultValue: DATE } },
    clearDisabledDates: { args: [], context: { defaultValue: DATE, disabledDates: `{{['${DATE}']}}` } },
    ...FOCUS_PAIR,
  },
  ShadDateTimePicker: {
    setValue: { args: ['21/10/2026 09:30', 'DD/MM/YYYY HH:mm'] },
    setValueInTimestamp: { args: [new Date(2026, 9, 21, 9, 30).getTime()] },
    setTime: { args: ['14:45'] },
    clearValue: { args: [], context: { defaultValue: '2026-10-21 09:30' } },
    setMinDate: { args: ['2026-11-01'], context: { defaultValue: '2026-10-21 09:30' } },
    setMaxDate: { args: ['2026-10-01'], context: { defaultValue: '2026-10-21 09:30' } },
    setDisabledDates: { args: [['2026-10-21']], context: { defaultValue: '2026-10-21 09:30' } },
    clearDisabledDates: {
      args: [],
      context: { defaultValue: '2026-10-21 09:30', disabledDates: "{{['2026-10-21']}}" },
    },
    ...FOCUS_PAIR,
  },
  ShadTimePicker: {
    setValue: { args: ['02:45 PM', 'hh:mm A'] },
    clearValue: { args: [], context: { defaultValue: '10:30' } },
    setMinTime: { args: ['11:00'], context: { defaultValue: '10:30' } },
    setMaxTime: { args: ['10:00'], context: { defaultValue: '10:30' } },
    ...FOCUS_PAIR,
  },
  ShadDialog: {
    open: { args: [] },
    close: { args: [], before: [['action', 'open']] },
    setDisableTrigger: { args: [true] },
    setDisableModal: { args: [true] },
  },
  ShadDropdownMenu: { open: { args: [] }, close: { args: [], before: [['action', 'open']] } },
  ShadFileUpload: {
    clearFiles: { args: [], context: { accept: '' }, before: [['upload', [['notes.txt', 'text/plain', 'hello']]]] },
    setFileName: {
      args: [0, 'renamed'],
      context: { accept: '' },
      before: [['upload', [['notes.txt', 'text/plain', 'hello']]]],
    },
  },
  ShadHeading: { setText: { args: ['A new heading'] }, clear: { args: [] } },
  ShadText: { setText: { args: ['A new paragraph'] }, clear: { args: [] } },
  ShadIcon: { click: { args: [], fires: 'onClick' } },
  ShadImage: { setImageURL: { args: ['https://example.com/other.png'] }, clearImage: { args: [] } },
  ShadMap: {
    setCenter: { args: [51.5074, -0.1278] },
    setZoom: { args: [5] },
    fitBounds: { args: [], before: [['action', 'setZoom', 3]] },
    selectMarker: { args: ['S-104'] },
    clearSelection: { args: [], before: [['action', 'selectMarker', 'S-104']] },
    setPickedLocation: { args: [37.79, -122.41], context: { pickLocation: '{{true}}' } },
    clearPickedLocation: {
      args: [],
      context: { pickLocation: '{{true}}', defaultPickedLocation: '{{({ lat: 37.79, lng: -122.41 })}}' },
    },
    setMapStyle: { args: ['satellite'] },
  },
  ShadChat: {
    appendHistory: { args: [{ message: 'A new reply', type: 'response' }] },
    sendMessage: { args: [{ message: 'A new question', type: 'message' }] },
    clearHistory: { args: [], before: [['action', 'appendHistory', { message: 'More', type: 'response' }]] },
    setHistory: { args: [[{ message: 'Only this', type: 'response', messageId: 'only' }]] },
    downloadChat: { args: [], download: true },
    setError: { args: ['The model timed out.'] },
    setHistoryLoading: { args: [true] },
    setResponseLoading: { args: [true] },
    setInputDisable: { args: [true] },
    setResponderAvatar: { args: ['https://example.com/bot.png'] },
    setUserAvatar: {
      args: ['https://example.com/me.png'],
      before: [['action', 'sendMessage', { message: 'Hi', type: 'message' }]],
    },
  },
  ShadQuestionnaire: {
    goTo: { args: [2] },
    reset: { args: [], before: [['action', 'goTo', 2]] },
  },
  ShadKanban: {
    addCard: { args: [{ title: 'Fresh card' }] },
    updateCardData: { args: [1, { title: 'Renamed' }] },
    moveCard: { args: [1, 'done'] },
    deleteCard: { args: [1] },
  },
  ShadLink: {
    click: { args: [], fires: 'onClick' },
    setLinkTarget: { args: ['https://example.com/other'] },
    setLinkText: { args: ['Another link'] },
  },
  ShadListView: {
    selectItem: { args: [2] },
    clearSelection: { args: [], before: [['action', 'selectItem', 2]] },
    setPage: { args: [2], context: { enablePagination: '{{true}}', rowsPerPage: '{{1}}' } },
  },
  ShadNavigation: {
    selectItem: { args: ['customers'] },
    setItemVisibility: { args: ['orders', false] },
    setItemDisable: { args: ['orders', true] },
    setCollapsed: { args: [true] },
  },
  ShadPagination: { setPage: { args: [3] } },
  ShadRadioGroup: { selectOption: { args: ['Premium'] }, deselectOption: { args: [] } },
  ShadRating: {
    setValue: { args: [2] },
    clear: { args: [], context: { defaultValue: '{{3}}' } },
    resetValue: { args: [], before: [['action', 'setValue', 5]] },
  },
  ShadSelect: {
    selectOption: { args: [2] },
    clear: { args: [], before: [['action', 'selectOption', 2]] },
    ...FOCUS_PAIR,
  },
  ShadSlider: {
    setValue: { args: [80] },
    setRangeValue: { args: [20, 70], context: { defaultValue: '{{[10, 40]}}' } },
    reset: { args: [], before: [['action', 'setValue', 90]] },
  },
  ShadStat: { setPrimaryValue: { args: ['$9,999.00'] }, setSecondaryValue: { args: ['+3.2%'] } },
  ShadSteps: {
    setStep: { args: [3] },
    nextStep: { args: [] },
    previousStep: { args: [], before: [['action', 'nextStep']] },
    resetSteps: { args: [], before: [['action', 'nextStep']] },
    setStepVisible: { args: [3, false] },
    setStepDisable: { args: [3, true] },
  },
  ShadTable: {
    setPage: { args: [2], context: { rowsPerPage: '{{1}}' } },
    selectRow: { args: ['name', 'Ada Lovelace'], context: { allowSelection: '{{true}}' } },
    deselectRow: { args: [], context: { allowSelection: '{{true}}' }, before: [['click', 'tbody tr', 0]] },
    selectRows: {
      args: ['id', [1, 2]],
      context: { allowSelection: '{{true}}', showBulkSelector: '{{true}}' },
    },
    deselectRows: {
      args: ['id', [1]],
      context: { allowSelection: '{{true}}', showBulkSelector: '{{true}}' },
      before: [['action', 'selectAllRows']],
    },
    selectAllRows: { args: [], context: { allowSelection: '{{true}}', showBulkSelector: '{{true}}' } },
    deselectAllRows: {
      args: [],
      context: { allowSelection: '{{true}}', showBulkSelector: '{{true}}' },
      before: [['action', 'selectAllRows']],
    },
    setFilters: { args: [[{ column: 'status', condition: 'equals', value: 'paid' }]] },
    clearFilters: {
      args: [],
      before: [['action', 'setFilters', [{ column: 'status', condition: 'equals', value: 'paid' }]]],
    },
    setSort: { args: ['amount', 'desc'] },
    setSearchText: { args: ['a'], before: [], after: [['wait', 600]] },
    discardChanges: {
      args: [],
      context: { columns: "{{[{ key: 'name', name: 'Name', isEditable: true }]}}" },
      before: [
        ['click', 'tbody td', 0],
        ['type', 'Zed', 'tbody input'],
        ['keyOn', 'tbody input', 0, 'Enter'],
      ],
    },
    downloadTableData: { args: ['csv'], download: true },
  },
  ShadTabs: {
    setTab: { args: ['t1'] },
    nextTab: { args: [] },
    previousTab: { args: [], before: [['action', 'nextTab']] },
    setTabDisable: { args: ['t1', true] },
    setTabLoading: { args: ['t0', true] },
    setTabVisibility: { args: ['t1', false] },
  },
  ShadTagsInput: {
    setTags: { args: [['one', 'two']] },
    selectTags: { args: [['extra']] },
    deselectTags: { args: [['react']] },
    clear: { args: [] },
    ...FOCUS_PAIR,
  },
  ShadToggleGroup: { setSelected: { args: ['Closed'] }, clear: { args: [] } },
};

// Junk an app (or a model) passes by mistake: every action takes each of these as its arguments without crashing,
// throwing or freezing the widget.
export const JUNK_ARGS = [
  [],
  [undefined, undefined, undefined],
  [null, null, null],
  [''],
  ['not a valid value', 'nor this'],
  [{}],
  [{ a: { b: [1, 2, 3] } }, []],
  [[1, 'two', null, {}]],
  [NaN],
  [-1, -1],
  [1e12, 1e12],
  [true, false],
  ['constructor', '__proto__'],
  [Array.from({ length: 5000 }, (_, i) => i)],
  ['x'.repeat(20000)],
];
