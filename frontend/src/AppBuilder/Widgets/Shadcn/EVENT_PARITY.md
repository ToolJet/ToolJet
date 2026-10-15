# shadcn/ui pack: event and action parity with the native widgets

Each pack widget has the events, component actions and exposed values of its closest native ToolJet widget, under the
native names, besides its own. Where the native widget lacks an event users expect, the pack widget has it anyway; the
**Native gap** column lists those. Pack names that differ from the native ones are kept as well, so apps already built
with them keep working.

Proved by the real-store suites in `__tests__/integration/props/`:

- `events.spec.jsx` fires every event (`eventTriggers.jsx`). Each event goes through ToolJet's own event handler
  (`set-custom-variable`), and the handler must already see the new exposed value.
- `actions.spec.jsx` calls every action (`actionArgs.jsx`). Valid arguments must change what the widget shows or
  exposes; 15 kinds of junk arguments must not crash it, throw or freeze it. It also checks the standard
  setVisibility, setDisable and setLoading on every widget.

Every widget also has setVisibility(value), setDisable(value) and setLoading(value), and exposes isVisible, isDisabled
and isLoading. Like the native Button, Text input and Text area, every pack widget also answers to the older
visibility(), disable() and loading() at run time. The inspector lists them only on Button, Input and Textarea.

## Inputs

| Pack widget | Native widget | Added for parity (native names) | Native gap the pack fills |
| --- | --- | --- | --- |
| Input | TextInput | actions disable, visibility; exposed label | |
| Textarea | TextArea | event onEnterPressed (Enter without Shift); actions disable, visibility; exposed label | |
| Number input | NumberInput | action setText; exposed label | |
| Password input | PasswordInput | exposed label | |
| Currency input | CurrencyInput | setValue(value, currency); exposed label | |
| Phone input | PhoneInput | setValue(value, country), setCountryCode(countryCode); exposed label | |
| OTP input | (none) | | onBlur, setBlur, setText; exposed label |
| Select | DropdownV2 | events onSelect, onFocus, onBlur; actions setFocus, setBlur; exposed options, label | |
| Combobox | DropdownV2 | events onFocus, onBlur; actions setFocus, setBlur; exposed label | |
| Multiselect | MultiselectV2 | events onFocus, onBlur; actions setFocus, setBlur; exposed label | |
| Tags input | TagsInput | events onTagDeleted, onFocus, onBlur; actions selectTags, deselectTags, setFocus, setBlur; exposed values, selectedTags, newTagsAdded, label | |
| Checkbox | Checkbox | actions toggle, setValue, setChecked; exposed label | |
| Switch | ToggleSwitchV2 | actions toggle, setValue; exposed label | |
| Radio group | RadioButtonV2 | event onSelectionChange; action deselectOption; exposed label, selectedOption, options | |
| Toggle group | ButtonGroupV2 | actions setSelected, clear; exposed selected | |
| Slider | RangeSliderV2 | actions setValue(num1), setRangeValue(num1, num2), reset; exposed label | |
| Rating | StarRating | action resetValue; exposed label | |
| Color picker | ColorPicker | events onFocus, onBlur; actions setFocus, setBlur; exposed selectedColorHex, selectedColorRGB, selectedColorRGBA, colorFormat, allowOpacity, isValid, label | |
| File upload | FilePicker | event onFileLoaded; actions clear, setFileName; exposed file, label | |
| Date picker | DatePickerV2, DaterangePicker | properties minDate, maxDate, disabledDates; events onSelect, onFocus, onBlur; actions setValue, setDate, clearValue, setValueInTimestamp, setStartDate, setEndDate, setDateRange, clearStartDate, clearEndDate, clearDateRange, setMinDate, setMaxDate, setDisabledDates, clearDisabledDates, setFocus, setBlur; exposed selectedDate, unixTimestamp, displayValue, startDateInUnix, endDateInUnix, selectedDateRange, dateFormat, minDate, maxDate, label | |
| Date and time picker | DatetimePickerV2 | events onSelect, onFocus, onBlur; actions setValue, setValueInTimestamp, setTime, clearValue, setMinDate, setMaxDate, setDisabledDates, clearDisabledDates, setFocus, setBlur; exposed label, dateFormat, timeFormat, minDate, maxDate | |
| Time picker | TimePicker | events onSelect, onFocus, onBlur; actions setValue(value, format), clearValue, setMinTime, setMaxTime, setFocus, setBlur; exposed label, timeFormat, minTime, maxTime | |

## Display and actions

| Pack widget | Native widget | Added for parity (native names) | Native gap the pack fills |
| --- | --- | --- | --- |
| Button | Button | event onHover; actions click, setText, disable, visibility, loading; exposed buttonText | |
| Heading, Text | Text | events onClick, onHover; actions setText, clear; exposed text | |
| Image | Image | actions setImageURL, clearImage; exposed imageURL, alternativeText | |
| Icon | Icon | event onHover; action click | |
| Link | Link | actions click, setLinkTarget, setLinkText; exposed linkTarget, linkText | |
| Progress | ProgressBar | action setValue; exposed value | |
| Circular progress | CircularProgressBar | action setValue; exposed value | |
| Stat | Statistics | actions setPrimaryValue, setSecondaryValue; exposed primaryLabel, primaryValue, secondaryLabel, secondaryValue | |
| Accordion | Accordion | events onExpand, onCollapse; actions expand(index), collapse(index) (no index: all); exposed isExpanded | |
| Key-value list | KeyValuePair | event onFieldClick; exposed data, lastClickedField | |
| Breadcrumb | (none) | | onItemClick with lastClickedItem |
| Steps | Steps | action setDisabled (the native spelling of setDisable) | |
| Navigation | Navigation | event onClick; actions selectItem, setItemVisibility, setItemDisable; exposed selectedItem, previousSelectedItem | |
| Kanban | Kanban | events onCardSelected, onUpdate (after every card change); action updateCardData; exposed updatedCardData, lastSelectedCard, lastCardMovement | |
| Table | Table | events onRowHovered (hoveredRow, hoveredRowId), onHeaderClick (selectedColumnHeader), onTableDataDownload | |
| Every chart | Chart | event onDoubleClick; action clearClickedPoint; exposed clickedDataPoint | |
| Sparkline | Chart | event onDoubleClick | |
| Dialog | ModalV2 | (already the native ModalV2 set) | |
| Dropdown menu | PopoverMenu | (already the native set, plus onOpen, onClose, open, close) | |
| Tabs, Pagination, List view, Button group | Tabs, Pagination, Listview, ButtonGroupV2 | (already the native set) | |
| Record list | Listview | event onRecordClicked (with its own onRowClicked); exposed selectedRecord and selectedRow (the clicked row's data), selectedRecordId and selectedRowId (its position in data) | |

Pack widgets with no native counterpart keep their own events. Carousel has onSlideChange and onSlideClick, Calendar
onSelect and onMonthChange, Tags onTagClick, Timeline onItemClick, Empty onAction, Hero onActionClick and
onSecondaryActionClick, and Card grid onCardClick.

## Not carried over, and why

- **Date and time picker time zones** (setDisplayTimezone, setStoreTimezone): the pack picker works in local time
  and has no time zone setting for these actions to change.
- **Currency input setCountryCode**: the pack picks a currency by its ISO code (setCurrency, or setValue's second
  argument), not by a country.
- **Table onExpand, onNewRowsAdded, discardNewlyAddedRows**: the pack table has no expandable rows and no add-row
  form. The native Table in the shadcn look (Table with styles.tableLook "shadcn") has both.
- **Key-value list edit events** (onSaveKeyValuePairChanges, onFieldValueChanged, onCancelKeyValuePairChanges): the
  pack list is read-only.
- **Kanban lastCardUpdate**: the pack exposes lastUpdatedCard (the whole card after the change).

## Native gaps found on the way

- The native Checkbox's setValue and setChecked fire onCheck or onUnCheck but not onChange, and its toggle fires
  onChange only. The pack fires what a click fires for all three.
- The native Pagination fires onPageChange and the Table onPageChanged. The pack keeps each native spelling.
- The native Steps spells its action setDisabled; every other widget spells it setDisable. The pack has both.
- ToolJet's event dispatcher (`onEvent` in `_stores/slices/eventsSlice.js`) runs handlers only for event names on a
  fixed list. A widget event that is not on it never runs its handlers, and nothing reports it. Fifteen pack events
  were missing, so handlers wired to them never ran: Kanban onCardClicked, Table onSelectionChanged and
  onActionButtonClicked, Tags input onTagRemoved, OTP onComplete, Tabs onFinish, Calendar onMonthChange, Carousel
  onSlideChange and onSlideClick, Tags onTagClick, Timeline and Breadcrumb onItemClick, Empty onAction, Hero
  onActionClick and onSecondaryActionClick, and Card grid onCardClick. They are now on the list.
