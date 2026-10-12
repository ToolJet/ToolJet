// What fires each event of each shadcn/ui pack widget (experiment): the interaction a user makes (or, where noted,
// the action an app calls), in the steps of probes.jsx, with the properties it needs. events.spec.jsx wires every
// event to a real event handler and checks that these steps fire it. `reads` names an exposed value the handler must
// already see updated when the event fires (the stale-value class of bug).

const OPEN = 'open';
const FOCUS = 'focus';
const BLUR = [['focus'], ['blur']];
const enter = (selector = 'input, textarea') => ['keyDown', 'Enter', selector];
const CHART = {
  onClick: { steps: [['chartClick']], reads: 'clickedDataPoint' },
  onDoubleClick: { steps: [['chartClick'], ['dblclick', '.recharts-wrapper']] },
};
const textBox = (typed = 'hello', selector) => ({
  onChange: { steps: [['type', typed, ...(selector ? [selector] : [])]], reads: 'value' },
  onEnterPressed: { steps: [enter(selector)] },
  onFocus: { steps: [FOCUS] },
  onBlur: { steps: BLUR },
});
// A popover field (select, date, time, colour): opening it focuses the field; closing it and leaving blurs it.
const popoverFocus = {
  onFocus: { steps: [FOCUS] },
  onBlur: { steps: BLUR },
};

// A table with an editable column and a button column, and a cell edit (click the cell, type, Enter).
const TABLE_EDIT_COLUMNS =
  "{{[{ key: 'name', name: 'Name', isEditable: true }, { key: 'actions', name: 'Actions', columnType: 'button', buttons: [{ id: 'open', label: 'Open' }] }]}}";
const EDIT_CELL = [
  ['click', 'tbody td', 0],
  ['type', 'Zed', 'tbody input'],
  ['keyOn', 'tbody input', 0, 'Enter'],
];

export const TRIGGERS = {
  ShadAccordion: {
    onChange: { steps: [['click', 'button', 0]], reads: 'openIndexes' },
    onExpand: { steps: [['click', 'button', 0]], reads: 'isExpanded' },
    onCollapse: {
      steps: [
        ['click', 'button', 0],
        ['click', 'button', 0],
      ],
    },
  },
  ShadAreaChart: CHART,
  ShadBarChart: CHART,
  ShadLineChart: CHART,
  ShadComboChart: CHART,
  ShadRadarChart: CHART,
  ShadPieChart: {
    onClick: { steps: [['click', '.recharts-pie-sector path, .recharts-sector', 0]], reads: 'clickedDataPoint' },
    onDoubleClick: { steps: [['dblclick', '.recharts-pie-sector path, .recharts-sector', 0]] },
  },
  ShadRadialChart: {
    context: { mode: 'categories' },
    onClick: { steps: [['click', '.recharts-radial-bar-sector', 0]], reads: 'clickedDataPoint' },
    onDoubleClick: { steps: [['dblclick', '.recharts-radial-bar-sector', 0]] },
  },
  ShadScatterChart: {
    onClick: { steps: [['click', '.recharts-symbols', 0]], reads: 'clickedDataPoint' },
    onDoubleClick: { steps: [['dblclick', '.recharts-symbols', 0]] },
  },
  ShadFunnelChart: {
    onClick: { steps: [['click', 'button', 1]], reads: 'clickedDataPoint' },
    onDoubleClick: { steps: [['dblclick', 'button', 1]] },
  },
  ShadHeatmapChart: {
    onClick: { steps: [['click', 'button', 1]], reads: 'clickedDataPoint' },
    onDoubleClick: { steps: [['dblclick', 'button', 1]] },
  },
  ShadSparkline: {
    onClick: { steps: [['click', 'svg', 0]] },
    onDoubleClick: { steps: [['dblclick', 'svg', 0]] },
  },
  ShadBreadcrumb: { onItemClick: { steps: [['click', 'li span', 0]], reads: 'lastClickedItem' } },
  ShadButton: {
    onClick: { steps: [['click', 'button', 0]] },
    onHover: { steps: [['mouseEnter', 'button', 0]] },
  },
  ShadButtonGroup: {
    onClick: { steps: [['click', 'button', 2]], reads: 'lastClicked' },
    onChange: { steps: [['click', 'button', 2]], reads: 'value' },
  },
  ShadCalendar: {
    onSelect: { steps: [['click', 'td button', 10]], reads: 'value' },
    onMonthChange: { steps: [['click', 'button[aria-label*="next" i]', 0]], reads: 'visibleMonth' },
  },
  ShadCardGrid: { onCardClick: { steps: [['click', '[role=button], button', 0]], reads: 'selectedItem' } },
  ShadSchedule: {
    onBookingClick: { steps: [['click', '[data-booking]', 0]], reads: 'selectedBooking' },
    onSlotClick: { steps: [['click', '[data-resource] button[aria-label$="free"]', 0]], reads: 'selectedSlot' },
  },
  ShadProgressList: { onItemClick: { steps: [['click', 'li', 1]], reads: 'selectedItem' } },
  ShadChat: {
    onMessageSent: {
      steps: [
        ['type', 'Where is my order?', 'textarea'],
        ['keyOn', 'textarea', 0, 'Enter'],
      ],
      reads: 'lastMessage',
    },
    onClearHistory: { steps: [['click', 'button[aria-label="Clear history"]', 0]] },
  },
  ShadQuestionnaire: {
    onStepChange: {
      steps: [
        ['click', '[role=radio]', 1],
        ['clickText', 'Next'],
      ],
      reads: 'currentIndex',
    },
    onSubmit: {
      context: { items: '{{[{ name: "note", prompt: "Anything else?", type: "text" }]}}' },
      steps: [['clickText', 'Submit']],
      reads: 'isComplete',
    },
  },
  ShadRecordList: {
    onRowClicked: { steps: [['click', 'li[role=button]', 0]], reads: 'selectedItem' },
    // The native List view's names: the clicked record and its position.
    onRecordClicked: { steps: [['click', 'li[role=button]', 1]], reads: 'selectedRecordId' },
  },
  ShadCarousel: {
    onSlideChange: { steps: [['click', 'button[aria-label*="next" i]', 0]], reads: 'currentIndex' },
    onSlideClick: { steps: [['click', '[aria-roledescription=slide] .cursor-pointer', 0]], reads: 'clickedSlide' },
  },
  ShadCheckbox: {
    onChange: { steps: [['click', '[role=checkbox]', 0]], reads: 'value' },
    onCheck: { steps: [['click', '[role=checkbox]', 0]], reads: 'value' },
    onUnCheck: {
      steps: [
        ['click', '[role=checkbox]', 0],
        ['click', '[role=checkbox]', 0],
      ],
    },
  },
  ShadColorPicker: {
    context: { showSwatches: '{{true}}' },
    onChange: { steps: [OPEN, ['click', 'button[aria-label^="#"], button[title^="#"]', 0]], reads: 'selectedColorHex' },
    ...popoverFocus,
  },
  ShadCombobox: {
    onSelect: { steps: [OPEN, ['click', '[cmdk-item]', 1]], reads: 'value' },
    onChange: { steps: [OPEN, ['click', '[cmdk-item]', 1]], reads: 'value' },
    onSearchTextChanged: { steps: [OPEN, ['type', 'wa', '[cmdk-input]']], reads: 'searchText' },
    ...popoverFocus,
  },
  ShadMultiselect: {
    onSelect: {
      steps: [
        ['click', '[role=combobox]', 0],
        ['click', '[cmdk-item]', 3],
      ],
      reads: 'values',
    },
    onChange: {
      steps: [
        ['click', '[role=combobox]', 0],
        ['click', '[cmdk-item]', 3],
      ],
      reads: 'values',
    },
    onSearchTextChanged: {
      steps: [
        ['click', '[role=combobox]', 0],
        ['type', 'de', '[cmdk-input]'],
      ],
      reads: 'searchText',
    },
    onFocus: { steps: [['focusOn', '[role=combobox]']] },
    onBlur: { steps: [['focusOn', '[role=combobox]'], ['blur']] },
  },
  ShadCurrencyInput: textBox('42'),
  ShadNumberInput: textBox('42'),
  ShadPasswordInput: textBox('s3cret!'),
  ShadPhoneInput: textBox('4155550123'),
  ShadInput: textBox('hello'),
  ShadTextarea: textBox('hello', 'textarea'),
  ShadOtpInput: {
    onChange: { steps: [['type', '12']], reads: 'value' },
    onComplete: { steps: [['type', '123456']], reads: 'isComplete' },
    onFocus: { steps: [FOCUS] },
    onBlur: { steps: BLUR },
  },
  ShadDatePicker: {
    onChange: { steps: [OPEN, ['click', 'td button', 10]], reads: 'value' },
    onSelect: { steps: [OPEN, ['click', 'td button', 10]], reads: 'selectedDate' },
    ...popoverFocus,
  },
  ShadDateTimePicker: {
    onChange: { steps: [OPEN, ['click', 'td button', 10]], reads: 'value' },
    onSelect: { steps: [OPEN, ['click', 'td button', 10]], reads: 'selectedDate' },
    ...popoverFocus,
  },
  ShadTimePicker: {
    onChange: { steps: [OPEN, ['click', '[role=option]', 3]], reads: 'value' },
    onSelect: { steps: [OPEN, ['click', '[role=option]', 3]], reads: 'value' },
    ...popoverFocus,
  },
  ShadSelect: {
    // Radix ignores a pointer release this close to where the list opened, so the option is picked by keyboard.
    onChange: { steps: [OPEN, ['keyOn', '[role=option]', 1, 'Enter']], reads: 'value' },
    onSelect: { steps: [OPEN, ['keyOn', '[role=option]', 1, 'Enter']], reads: 'selectedOption' },
    ...popoverFocus,
  },
  ShadDialog: {
    onOpen: { steps: [['click', 'button', 0]], reads: 'show' },
    onClose: { steps: [['click', 'button', 0], ['escape']] },
  },
  ShadDropdownMenu: {
    onOpen: { steps: [OPEN], reads: 'isOpen' },
    onSelect: { steps: [OPEN, ['click', '[role=menuitem]', 0]], reads: 'lastClickedOption' },
    onClose: { steps: [OPEN, ['escape']] },
  },
  ShadEmpty: { context: { actionLabel: 'Retry' }, onAction: { steps: [['click', 'button', 0]] } },
  ShadFileUpload: {
    context: { accept: '' },
    onFileSelected: { steps: [['upload', [['notes.txt', 'text/plain', 'hello world']]]], reads: 'files' },
    onFileLoaded: { steps: [['upload', [['notes.txt', 'text/plain', 'hello world']]]], reads: 'file' },
    onFileDeselected: {
      steps: [
        ['upload', [['notes.txt', 'text/plain', 'hello world']]],
        ['click', 'button[aria-label^="Remove"]', 0],
      ],
    },
  },
  ShadHeading: { onClick: { steps: [['click', 'h2', 0]] }, onHover: { steps: [['mouseEnter', 'h2', 0]] } },
  ShadText: { onClick: { steps: [['click', 'p', 0]] }, onHover: { steps: [['mouseEnter', 'p', 0]] } },
  ShadHero: {
    context: { actionLabel: 'Book now', secondaryActionLabel: 'Learn more' },
    onActionClick: { steps: [['clickText', 'Book now']] },
    onSecondaryActionClick: { steps: [['clickText', 'Learn more']] },
  },
  ShadIcon: {
    onClick: { steps: [['click', '[role=button]', 0]] },
    onHover: { steps: [['mouseEnter', '[role=button]', 0]] },
  },
  ShadImage: { onClick: { steps: [['click', '[role=button]', 0]] } },
  ShadKanban: {
    context: { allowAdd: '{{true}}' },
    onCardClicked: { steps: [['click', '[aria-roledescription=draggable]', 0]], reads: 'selectedCard' },
    onCardSelected: { steps: [['click', '[aria-roledescription=draggable]', 0]], reads: 'lastSelectedCard' },
    onAddCardClick: { steps: [['clickText', 'Add card']], reads: 'addCardColumn' },
    // Fired by the actions (and by a drag, which the board model's fuzz covers: jsdom has no layout to drag in).
    onCardAdded: { steps: [['action', 'addCard', { title: 'New' }]], reads: 'lastAddedCard' },
    onCardUpdated: { steps: [['action', 'updateCard', 1, { title: 'Renamed' }]], reads: 'lastUpdatedCard' },
    onCardRemoved: { steps: [['action', 'deleteCard', 1]], reads: 'lastRemovedCard' },
    onCardMoved: { steps: [['action', 'moveCard', 1, 'done']], reads: 'lastCardMovement' },
    onUpdate: { steps: [['action', 'updateCard', 1, { title: 'Renamed' }]], reads: 'updatedCardData' },
  },
  ShadKeyValue: { onFieldClick: { steps: [['click', '[role=button]', 0]], reads: 'lastClickedField' } },
  ShadLink: {
    onClick: { steps: [['click', 'a, button', 0]] },
    onHover: { steps: [['mouseEnter', 'a, button', 0]] },
  },
  ShadListView: {
    context: { enablePagination: '{{true}}', rowsPerPage: '{{1}}' },
    // selectedRow and selectedRecord hold the row's child components' values (none here), as on the native List view.
    onRowClicked: { steps: [['click', '[data-row], [role=listitem], [role=button]', 0]], reads: 'selectedItem' },
    onRecordClicked: { steps: [['click', '[data-row], [role=listitem], [role=button]', 0]], reads: 'selectedRecordId' },
    onPageChanged: { steps: [['click', 'button[aria-label*="next" i]', 0]], reads: 'pageIndex' },
  },
  ShadNavigation: {
    onSelect: { steps: [['clickText', 'Orders']], reads: 'value' },
    onClick: { steps: [['clickText', 'Orders']], reads: 'selectedItem' },
  },
  ShadPagination: { onPageChange: { steps: [['clickText', '2']], reads: 'currentPageIndex' } },
  ShadRadioGroup: {
    onChange: { steps: [['click', '[role=radio]', 1]], reads: 'value' },
    onSelectionChange: { steps: [['click', '[role=radio]', 1]], reads: 'value' },
  },
  ShadRating: { onChange: { steps: [['click', '[role=radio]', 3]], reads: 'value' } },
  ShadSlider: { onChange: { steps: [['keyDown', 'ArrowRight', '[role=slider]']], reads: 'value' } },
  ShadSteps: { onSelect: { steps: [['click', 'button', 2]], reads: 'currentStepId' } },
  ShadSwitch: { onChange: { steps: [['click', '[role=switch]', 0]], reads: 'value' } },
  ShadTable: {
    context: {
      allowSelection: '{{true}}',
      displaySearchBox: '{{true}}',
      showDownloadButton: '{{true}}',
      showRefreshButton: '{{true}}',
      enablePagination: '{{true}}',
      rowsPerPage: '{{1}}',
    },
    onRowClicked: { steps: [['click', 'tbody tr', 0]], reads: 'selectedRow' },
    onSelectionChanged: { steps: [['click', 'tbody tr', 0]], reads: 'selectedRows' },
    onRowHovered: { steps: [['mouseEnter', 'tbody tr', 0]], reads: 'hoveredRow' },
    onHeaderClick: { steps: [['click', 'th', 0]], reads: 'selectedColumnHeader' },
    onSort: { steps: [['click', 'th button', 0]], reads: 'sortApplied' },
    onSearch: {
      steps: [
        ['type', 'a', 'input[type=search], input'],
        ['wait', 600],
      ],
      reads: 'searchText',
    },
    onPageChanged: { steps: [['click', 'button[aria-label*="next" i]', 0]], reads: 'pageIndex' },
    onRefresh: { steps: [['click', 'button[aria-label*="refresh" i]', 0]] },
    onTableDataDownload: {
      steps: [
        ['click', 'button[aria-label*="download" i]', 0],
        ['clickText', 'Download CSV'],
      ],
    },
    onFilterChanged: {
      steps: [['action', 'setFilters', [{ column: 'name', condition: 'contains', value: 'a' }]]],
      reads: 'filters',
    },
    onActionButtonClicked: {
      context: { columns: TABLE_EDIT_COLUMNS },
      steps: [['clickText', 'Open']],
      reads: 'lastActionClicked',
    },
    onCellValueChanged: { context: { columns: TABLE_EDIT_COLUMNS }, steps: EDIT_CELL, reads: 'changeSet' },
    onBulkUpdate: {
      context: { columns: TABLE_EDIT_COLUMNS },
      steps: [...EDIT_CELL, ['clickText', 'Save changes']],
      reads: 'dataUpdates',
    },
    onCancelChanges: { context: { columns: TABLE_EDIT_COLUMNS }, steps: [...EDIT_CELL, ['clickText', 'Discard']] },
  },
  ShadTabs: {
    onTabSwitch: { steps: [['click', '[role=tab]', 1]], reads: 'currentTab' },
    onFinish: {
      context: { variant: 'steps' },
      steps: [
        ['action', 'nextTab'],
        ['action', 'nextTab'],
        ['action', 'nextTab'],
        ['action', 'nextTab'],
        ['clickText', 'Finish'],
      ],
      reads: 'isLastStep',
    },
  },
  ShadTags: { onTagClick: { steps: [['click', 'button, [role=button]', 0]], reads: 'lastClickedTag' } },
  ShadTagsInput: {
    onChange: { steps: [['type', 'gamma,']], reads: 'tags' },
    onTagAdded: { steps: [['type', 'gamma,']], reads: 'lastAddedTag' },
    onTagRemoved: { steps: [['click', 'button[aria-label^="Remove"]', 0]], reads: 'lastRemovedTag' },
    onTagDeleted: { steps: [['click', 'button[aria-label^="Remove"]', 0]], reads: 'tags' },
    onFocus: { steps: [FOCUS] },
    onBlur: { steps: BLUR },
  },
  ShadTimeline: { onItemClick: { steps: [['click', 'li', 0]], reads: 'lastClickedItem' } },
  ShadToggleGroup: { onChange: { steps: [['click', '[role=radio]', 1]], reads: 'value' } },
};
