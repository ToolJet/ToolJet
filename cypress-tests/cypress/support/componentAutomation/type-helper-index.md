# type-helper-index (AUTO-GENERATED — do not edit)

| config type | helper | file | block | usage |
|---|---|---|---|---|
| - | `closeAccordions` | appBuilder/properties.js | common | `closeAccordions(['General', 'Properties'], '0')` |
| - | `openAccordion` | appBuilder/properties.js | common | `openAccordion('Properties', ['General'], '0')` |
| - | `openEditorSidebar` | appBuilder/properties.js | common | `openEditorSidebar('textinput1')` |
| code | `verifyAndModifyParameter` | appBuilder/properties.js | properties | `verifyAndModifyParameter('Text', 'Hello World')` |
| toggle | `verifyAndModifyToggleFx` | appBuilder/properties.js | properties | `verifyAndModifyToggleFx('Loading state', '{{false}}')` |
| switch | `verifyAndModifySwitch` | appBuilder/properties.js | properties | `verifyAndModifySwitch('Default state', 'On')` |
| - | `verifyTooltip` | appBuilder/properties.js | properties | `verifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')` |
| - | `addAndVerifyTooltip` | appBuilder/properties.js | properties | `addAndVerifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')` |
| - | `editAndVerifyWidgetName` | appBuilder/properties.js | properties | `editAndVerifyWidgetName('myButton', ['General', 'Properties', 'Devices'])` |
| - | `verifyPropertiesGeneralAccordion` | appBuilder/properties.js | properties | `verifyPropertiesGeneralAccordion('textinput1', 'Enter your name')` |
| - | `selectFromSidebarDropdown` | appBuilder/properties.js | properties | `selectFromSidebarDropdown('Alignment', 'center')` |
| - | `addValueOnInput` | appBuilder/properties.js | properties | `addValueOnInput('Border radius', '8')` |
| colorSwatches | `selectColourFromColourPicker` | appBuilder/styles.js | styles | `selectColourFromColourPicker('Background', ['255','0','0','100'])` |
| boxShadow | `fillBoxShadowParams` | appBuilder/styles.js | styles | `fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], [2, 4, 6, 0])` |
| boxShadow | `verifyBoxShadowCss` | appBuilder/styles.js | styles | `verifyBoxShadowCss('textinput1', [0,0,0,1], [2,4,6,0])` |
| - | `verifyAndModifyStylePickerFx` | appBuilder/styles.js | styles | `verifyAndModifyStylePickerFx('Border radius', '0', '4px')` |
| colorSwatches | `verifyWidgetColorCss` | appBuilder/styles.js | styles | `verifyWidgetColorCss('textinput1', 'background-color', ['255','0','0','100'])` |
| - | `verifyLoaderColor` | appBuilder/styles.js | styles | `verifyLoaderColor('button1', ['255','0','0','100'])` |
| - | `verifyStylesGeneralAccordion` | appBuilder/styles.js | styles | `verifyStylesGeneralAccordion('textinput1', [2,4,6,0], '#ff0000', [255,0,0,100])` |
| - | `checkPaddingOfContainer` | appBuilder/styles.js | styles | `checkPaddingOfContainer('container1', '16', 'Box')` |
| - | `verifyWidgetText` | appBuilder/components.js | properties | `verifyWidgetText('textinput1', 'Hello')` |
| - | `addTextWidgetToVerifyValue` | appBuilder/components.js | canvas | `addTextWidgetToVerifyValue('components.textinput1.value')` |
| - | `verifyContainerElements` | appBuilder/components.js | properties | `verifyContainerElements()` |
| toggle | `verifyLayout` | appBuilder/layout.js | properties | `verifyLayout('textinput1')` |
| exposed | `openAndVerifyNode` | appBuilder/inspectorTree.js | inspector | `openAndVerifyNode('textinput1', nodes, verifyNodeData)` |
| exposed | `verifyNodes` | appBuilder/inspectorTree.js | inspector | `verifyNodes([{ key: 'value', type: 'string', value: 'hello' }], verifyNodeData)` |
| exposed | `openNode` | appBuilder/inspectorTree.js | inspector | `openNode('components', 0)` |
| - | `openSubNode` | appBuilder/inspectorTree.js | inspector | `openSubNode('textinput1', 'components')` |
| - | `backFromDetail` | appBuilder/inspectorTree.js | common | `backFromDetail()` |
| - | `openSubNodeAndVerify` | appBuilder/inspectorTree.js | inspector | `openSubNodeAndVerify('globals', 'currentUser', nodes, verifyNodeData)` |
| - | `openStateFromComponent` | appBuilder/inspectorTree.js | inspector | `openStateFromComponent('textinput1')` |
| exposed | `verifyNodeData` | appBuilder/inspectorTree.js | inspector | `verifyNodeData('value', 'string', 'hello', 0)` |
| - | `deleteComponentFromInspector` | appBuilder/inspectorTree.js | inspector | `deleteComponentFromInspector('textinput1')` |
| - | `navigateToInspectorNodes` | appBuilder/inspectorTree.js | inspector | `navigateToInspectorNodes(['globals', 'currentUser', 'email'])` |
| - | `verifyInspectorValue` | appBuilder/inspectorTree.js | inspector | `verifyInspectorValue('currentUser', 'admin')` |
| - | `verifyInspectorKeyValue` | appBuilder/inspectorTree.js | inspector | `verifyInspectorKeyValue('isValid', 'true')` |
| - | `navigateAndVerifyInspector` | appBuilder/inspectorTree.js | inspector | `navigateAndVerifyInspector(['globals','currentUser','firstName'], [['firstName','Admin']])` |
| - | `verifyComponentValueFromInspector` | appBuilder/inspectorTree.js | inspector | `verifyComponentValueFromInspector('textinput1', 'hello')` |
| - | `verifyMultipleComponentValuesFromInspector` | appBuilder/inspectorTree.js | inspector | `verifyMultipleComponentValuesFromInspector('select1', ['opt1', 'opt2'])` |
| - | `verifyComponentFromInspector` | appBuilder/inspectorTree.js | inspector | `verifyComponentFromInspector('textinput1')` |
| - | `copyWidget` | appBuilder/canvas.js | canvas | `copyWidget('button1')` |
| - | `pasteWidget` | appBuilder/canvas.js | canvas | `pasteWidget()                                            // onto the root canvas` |
| - | `copyPasteWidget` | appBuilder/canvas.js | canvas | `copyPasteWidget('button1')   // clones button1 → button2 via clipboard` |
| - | `duplicateWidgetByKeyboard` | appBuilder/canvas.js | canvas | `duplicateWidgetByKeyboard('button1')` |
| - | `openComponentInspectorMenu` | appBuilder/canvas.js | canvas | `openComponentInspectorMenu('button1')` |
| - | `selectComponentInspectorMenuOption` | appBuilder/canvas.js | canvas | `selectComponentInspectorMenuOption('button1', 'duplicate')` |
| - | `duplicateWidgetFromMenu` | appBuilder/canvas.js | canvas | `duplicateWidgetFromMenu('button1')` |
| - | `renameWidgetFromMenu` | appBuilder/canvas.js | canvas | `renameWidgetFromMenu('button1', 'submitBtn')` |
| - | `deleteWidgetFromMenu` | appBuilder/canvas.js | canvas | `deleteWidgetFromMenu('button1')` |
| - | `selectAllWidgets` | appBuilder/canvas.js | canvas | `selectAllWidgets()   // Cmd/Ctrl+A — selects every widget on the canvas` |
| - | `multiSelectWidgets` | appBuilder/canvas.js | canvas | `multiSelectWidgets(['button1', 'button2'])` |
| - | `verifySelectedWidgetCount` | appBuilder/canvas.js | canvas | `verifySelectedWidgetCount(2)   // after selectAll / multiSelect` |
| - | `undo` | appBuilder/canvas.js | canvas | `undo()   // Cmd/Ctrl+Z — reverts the last canvas action` |
| - | `redo` | appBuilder/canvas.js | canvas | `redo()   // Cmd/Ctrl+Shift+Z — re-applies the last undone action` |
| - | `nudgeWidget` | appBuilder/canvas.js | canvas | `nudgeWidget('button1', 'ArrowRight', 10)   // arrow-key move the selected widget` |
| - | `cutWidget` | appBuilder/canvas.js | canvas | `cutWidget('button1')   // removes it from canvas; pasteWidget() restores it` |
| - | `getWidgetRect` | appBuilder/canvas.js | canvas | `getWidgetRect('button1').as('r0')   // capture BEFORE a move/resize` |
| - | `verifyWidgetMoved` | appBuilder/canvas.js | canvas | `verifyWidgetMoved('button1', before)   // before = getWidgetRect result` |
| - | `verifyWidgetResized` | appBuilder/canvas.js | canvas | `verifyWidgetResized('button1', before) // before = getWidgetRect result` |
| - | `verifyWidgetCount` | appBuilder/canvas.js | canvas | `verifyWidgetCount('button', 2)   // button1 + button2 after a clone` |
| events | `selectEvent` | appBuilder/events.js | events | `selectEvent('On click', 'Show Alert')` |
| csa | `selectCSA` | appBuilder/events.js | csa | `selectCSA('textinput1', 'Set text')` |
| - | `addSupportCSAData` | appBuilder/events.js | csa | `addSupportCSAData('alert-message', 'Hello world')` |
| - | `selectSupportCSAData` | appBuilder/events.js | csa | `selectSupportCSAData('First option')` |
| - | `changeEventType` | appBuilder/events.js | events | `changeEventType('On blur', 0)` |
| events | `addMultiEventsWithAlert` | appBuilder/events.js | events | `addMultiEventsWithAlert([{ event: 'On click', message: 'clicked' }])` |
| - | `setCSAParam` | appBuilder/events.js | csa | `setCSAParam({ label: 'Column key', type: 'toggle', value: true })` |
| csa | `configureCSA` | appBuilder/events.js | csa | `configureCSA('textinput1', 'Set text', [{ label: 'text', value: '{{"hi"}}' }])` |
| - | `verifyControlComponentAction` | appBuilder/csa.js | csa | `verifyControlComponentAction('textinput1', 'hello')` |
| - | `randomString` | appBuilder/csa.js | common | `randomString(8)` |
| csa | `verifyCSA` | appBuilder/csa.js | csa | `verifyCSA('textinput1')` |
| csa | `addCSA` | appBuilder/csa.js | csa | `addCSA('textinput1', [{ event: 'On click', action: 'Set text', value: 'hello' }])` |
| code | `addAndVerifyOnSingleLine` | appBuilder/codehinter.js | common | `addAndVerifyOnSingleLine('Hello', 'text', 'text1')` |
| - | `renameApp` | appBuilder/editorHeader.js | editor | `renameApp('My App')` |
| - | `verifyAppName` | appBuilder/editorHeader.js | editor | `verifyAppName('My App')` |
| - | `verifyCurrentEnvironment` | appBuilder/editorHeader.js | editor | `verifyCurrentEnvironment('Development')` |
| - | `verifyCurrentVersion` | appBuilder/editorHeader.js | editor | `verifyCurrentVersion('v1')` |
| - | `addNewVersion` | appBuilder/editorHeader.js | editor | `addNewVersion('v2', 'v1')` |
| - | `promoteEnv` | appBuilder/editorHeader.js | editor | `promoteEnv()` |
| - | `pageHandleCy` | appBuilder/pages.js | pages | `pageHandleCy('My Page') // -> 'my-page'` |
| - | `openPagesPanel` | appBuilder/pages.js | pages | `openPagesPanel()` |
| - | `openPageEditor` | appBuilder/pages.js | pages | `openPageEditor('Home')` |
| - | `closePageEditor` | appBuilder/pages.js | pages | `closePageEditor()` |
| - | `searchPage` | appBuilder/pages.js | pages | `searchPage('Home')` |
| - | `clearSearch` | appBuilder/pages.js | pages | `clearSearch()` |
| - | `addNewPage` | appBuilder/pages.js | pages | `addNewPage('Reports')` |
| - | `modifyPageHandle` | appBuilder/pages.js | pages | `modifyPageHandle('Reports', 'reports-v2')` |
| - | `detetePage` | appBuilder/pages.js | pages | `detetePage('Reports')` |
| - | `hideOrUnhidePage` | appBuilder/pages.js | pages | `hideOrUnhidePage('Reports')` |
| - | `setHomePage` | appBuilder/pages.js | pages | `setHomePage('Reports')` |
| - | `addEventHandler` | appBuilder/pages.js | pages | `addEventHandler('Reports')` |
| - | `disableOrEnablePage` | appBuilder/pages.js | pages | `disableOrEnablePage('Reports')` |
| - | `hideOrUnhidePageMenu` | appBuilder/pages.js | pages | `hideOrUnhidePageMenu()` |
| - | `selectQueryFromLandingPage` | appBuilder/querymanager/queries.js | common | `selectQueryFromLandingPage('PostgreSQL', 'PostgreSQL')` |
| - | `deleteQuery` | appBuilder/querymanager/queries.js | common | `deleteQuery('restapi1')` |
| - | `query` | appBuilder/querymanager/queries.js | common | `query('create')   // clicks query-create-button` |
| - | `changeQueryToggles` | appBuilder/querymanager/queries.js | common | `changeQueryToggles('notification-on-success')` |
| - | `renameQueryFromEditor` | appBuilder/querymanager/queries.js | common | `renameQueryFromEditor('getUsers')` |
| - | `addInputOnQueryField` | appBuilder/querymanager/queries.js | common | `addInputOnQueryField('url', 'https://api.example.com')` |
| - | `waitForQueryAction` | appBuilder/querymanager/queries.js | common | `waitForQueryAction('run')` |
| events | `selectRunQueryEvent` | appBuilder/querymanager/queries.js | events | `selectRunQueryEvent('Query Success')` |
| - | `chainQuery` | appBuilder/querymanager/queries.js | events | `chainQuery('getUsers', 'refreshTable')` |
| - | `addSuccessNotification` | appBuilder/querymanager/queries.js | common | `addSuccessNotification('Saved!')` |
| - | `performQueryAction` | appBuilder/querymanager/queries.js | common | `performQueryAction('q1', 'rename', 'q2') // action: rename \| duplicate \| delete` |
| - | `verifypreview` | appBuilder/querymanager/queries.js | common | `verifypreview('json', 'success')  // type: json \| raw` |
| - | `addQueryN` | appBuilder/querymanager/queries.js | common | `addQueryN('getUsers', 'SELECT` |
| - | `addQuery` | appBuilder/querymanager/queries.js | common | `addQuery('getUsers', 'SELECT` |
| - | `addDsAndAddQuery` | appBuilder/querymanager/queries.js | common | `addDsAndAddQuery('getUsers', 'SELECT 1', 'postgresql')` |
| - | `addQueryAndOpenEditor` | appBuilder/querymanager/queries.js | common | `addQueryAndOpenEditor('getUsers', 'SELECT 1', 'postgresql', 'MyApp')` |
| - | `createDataQuery` | appBuilder/querymanager/queries.js | common | `createDataQuery('MyApp', 'baseUrl', 'apiKey', 'token')` |
| - | `createRestAPIQuery` | appBuilder/querymanager/queries.js | common | `createRestAPIQuery('getData', 'restDs', '', '', 'https://api.example.com', true)` |
| - | `verifyPreviewData` | appBuilder/querymanager/queries.js | common | `verifyPreviewData('expected value')` |
| - | `resizeQueryPanel` | appBuilder/querymanager/queryPanel.js | querymanager | `resizeQueryPanel('90')   // set panel height to 90%` |
| - | `addBasicData` | appBuilder/components/button.js | properties | `addBasicData({ widgetName: 'btnClone', tooltipText: 'hi', backgroundColor: ['255','0','0','100'] })` |
| - | `verifyBasicData` | appBuilder/components/button.js | properties | `verifyBasicData('btnClone', { widgetName: 'btnClone', tooltipText: 'hi', backgroundColor: ['255','0','0','100'] })` |
| - | `tableWidgetOuter` | appBuilder/components/table.js | canvas | `cy.get(tableWidgetOuter('table1')).first().click()` |
| - | `resizeTableWidget` | appBuilder/components/table.js | canvas | `resizeTableWidget('table1', 1200, 300)` |
| - | `setTableData` | appBuilder/components/table.js | canvas | `setTableData('[{ id: 1, name: "A" }]')` |
| - | `searchOnTable` | appBuilder/components/table.js | canvas | `searchOnTable('Sarah', 'table1')` |
| - | `verifyTableElements` | appBuilder/components/table.js | canvas | `verifyTableElements([{ id: 1, name: 'A', email: 'a` |
| - | `selectDropdownOption` | appBuilder/components/table.js | inspector | `selectDropdownOption('[data-cy="dropdown-column-type"]>>:eq(0)', 'string')` |
| - | `verifyAndEnterColumnOptionInput` | appBuilder/components/table.js | inspector | `verifyAndEnterColumnOptionInput('Column name', 'status')` |
| - | `addAndOpenColumnOption` | appBuilder/components/table.js | inspector | `addAndOpenColumnOption('status', 'string')` |
| - | `deleteAndVerifyColumn` | appBuilder/components/table.js | inspector | `deleteAndVerifyColumn('email')` |
| - | `verifyInvalidFeedback` | appBuilder/components/table.js | canvas | `verifyInvalidFeedback('id', 0, 'Required')` |
| - | `addInputOnTable` | appBuilder/components/table.js | canvas | `addInputOnTable('name', 0, 'Alice', 'input')` |
| - | `verifySingleValueOnTable` | appBuilder/components/table.js | canvas | `verifySingleValueOnTable('name', 0, 'Alice')` |
| toggle | `verifyAndModifyToggleFx` | appBuilder/components/table.js | properties | `verifyAndModifyToggleFx('Show search', 'false')` |
| - | `selectFromSidebarDropdown` | appBuilder/components/table.js | properties | `selectFromSidebarDropdown('[data-cy="..."]', 'Fixed')` |
| - | `dataPdfAssertionHelper` | appBuilder/components/table.js | common | `dataPdfAssertionHelper(rows)` |
| - | `dataCsvAssertionHelper` | appBuilder/components/table.js | common | `dataCsvAssertionHelper(rows)` |
| - | `addFilter` | appBuilder/components/table.js | canvas | `addFilter([{ column: 'name', operation: 'contains', value: 'Sarah' }], true, 'table1')` |
| - | `verifyTableExposedVars` | appBuilder/components/table.js | inspector | `verifyTableExposedVars([{ key: 'currentPageData', type: 'Array', value: '[...]' }], 'table1')` |
| - | `makeAllColumnsEditable` | appBuilder/components/table.js | inspector | `makeAllColumnsEditable()` |
| - | `makeColumnEditable` | appBuilder/components/table.js | inspector | `makeColumnEditable('name')` |
| - | `typeIntoEditableCell` | appBuilder/components/table.js | canvas | `typeIntoEditableCell(tableSelector.cell('name', 0, 'table1'), 'Alice')` |
| - | `editTableCell` | appBuilder/components/table.js | canvas | `editTableCell('name', 0, 'Alice', 'table1')` |
| - | `addNewRow` | appBuilder/components/table.js | canvas | `addNewRow('table1')` |
| - | `addNewRowCellInput` | appBuilder/components/table.js | canvas | `addNewRowCellInput('name', 0, 'Nick')` |
| toggle | `toggleTableProperty` | appBuilder/components/table.js | properties | `toggleTableProperty(tableText.toggleShowSearch)` |
| - | `setRowsPerPage` | appBuilder/components/table.js | properties | `setRowsPerPage(3)` |
| - | `selectTableRow` | appBuilder/components/table.js | canvas | `selectTableRow(0, 'name', 'table1')` |
| - | `toggleRowCheckbox` | appBuilder/components/table.js | canvas | `toggleRowCheckbox(0, 'table1')` |
| - | `verifySelectedRowCount` | appBuilder/components/table.js | canvas | `verifySelectedRowCount(2, 'table1')` |
| - | `sortByColumn` | appBuilder/components/table.js | canvas | `sortByColumn('name')` |
| - | `selectFromDropDown` | appBuilder/components/dropdown.js | canvas | `selectFromDropDown('dropdown1', 'Option A')` |
| - | `clearSelection` | appBuilder/components/dropdown.js | canvas | `clearSelection('dropdown1')` |
| - | `verifySelectedOptionOnDropdown` | appBuilder/components/dropdown.js | canvas | `verifySelectedOptionOnDropdown('dropdown1', 'Option A')` |
| - | `verifyOptionOnSidePanel` | appBuilder/components/dropdown.js | inspector | `verifyOptionOnSidePanel('Option A')` |
| - | `deleteOption` | appBuilder/components/dropdown.js | inspector | `deleteOption('Option A')` |
| - | `addNewOption` | appBuilder/components/dropdown.js | inspector | `addNewOption()` |
| - | `updateOptionLabelAndValue` | appBuilder/components/dropdown.js | inspector | `updateOptionLabelAndValue('Option A', 'New label', 'newValue')` |
| - | `verifyOptionOnDropdown` | appBuilder/components/dropdown.js | canvas | `verifyOptionOnDropdown('dropdown1', ['Option A', 'Option B'])` |
| - | `verifyOptionMenuElements` | appBuilder/components/dropdown.js | inspector | `verifyOptionMenuElements('Option A', [])` |
| - | `selectAndVerifyDate` | appBuilder/components/datePicker.js | canvas | `selectAndVerifyDate('datepicker1', '15/06/2024')` |
| - | `verifyDate` | appBuilder/components/datePicker.js | canvas | `verifyDate('datepicker1', '15 06 2024')` |
| - | `selectAndVerifyTime` | appBuilder/components/datePicker.js | canvas | `selectAndVerifyTime('datepicker1', '10:30 AM')` |
| - | `renameListView` | appBuilder/components/listView.js | properties | `renameListView('myList')` |
| - | `addRecordClickedAlertHandler` | appBuilder/components/listView.js | events | `addRecordClickedAlertHandler('clicked!')` |
| - | `clickListViewRow` | appBuilder/components/listView.js | canvas | `clickListViewRow('myList', 0)` |
| - | `deleteInnerWidget` | appBuilder/components/listView.js | canvas | `deleteInnerWidget('myList', 'text1')` |
| - | `dropWidgetToListview` | appBuilder/components/listView.js | canvas | `dropWidgetToListview('Text', 250, 45, 'myList')` |
| - | `verifyMultipleComponentValuesFromInspector` | appBuilder/components/listView.js | inspector | `verifyMultipleComponentValuesFromInspector('myList', 'text1', ['a','b'])` |
| - | `addDataToListViewInputs` | appBuilder/components/listView.js | canvas | `addDataToListViewInputs('myList', 'input1', ['a','b'])` |
| - | `verifyValuesOnList` | appBuilder/components/listView.js | canvas | `verifyValuesOnList('myList', 'text1', 'text', ['a','b'])` |
| - | `verifyExposedValueByToast` | appBuilder/components/listView.js | canvas | `verifyExposedValueByToast('myList', ['a','b'])` |
| - | `textArrayOfLength` | appBuilder/components/listView.js | common | `const labels = textArrayOfLength(3)` |
| - | `verifyMultiselectOptions` | appBuilder/components/multiSelect.js | canvas | `verifyMultiselectOptions('multiselect1', ['one','two','three'])` |
| - | `verifyMultiselectStatus` | appBuilder/components/multiSelect.js | canvas | `verifyMultiselectStatus('multiselect1', ['', '', 'not.'])` |
| - | `selectFromMultiSelect` | appBuilder/components/multiSelect.js | canvas | `selectFromMultiSelect('multiselect1', ['true','false','true'])` |
| - | `verifyMultiselectHeader` | appBuilder/components/multiSelect.js | canvas | `verifyMultiselectHeader('multiselect1', 'Select...')` |
| - | `launchButton` | appBuilder/components/modal.js | canvas | `cy.get(launchButton('modal1')).click()` |
| - | `launchModal` | appBuilder/components/modal.js | canvas | `launchModal('modal1')` |
| - | `closeModal` | appBuilder/components/modal.js | canvas | `closeModal()` |
| colorSwatches | `addAndVerifyColor` | appBuilder/components/modal.js | styles | `addAndVerifyColor('Background', ['255','0','0','100'], '[data-cy="..."]')` |
| - | `verifyComponent` | appBuilder/components/basicComponents.js | canvas | `verifyComponent('button1')` |
| - | `verifyComponentinrightpannel` | appBuilder/components/basicComponents.js | canvas | `verifyComponentinrightpannel('button')` |
| - | `deleteComponentAndVerify` | appBuilder/components/basicComponents.js | canvas | `deleteComponentAndVerify('button1')` |
| - | `verifyComponentWithOutLabel` | appBuilder/components/basicComponents.js | canvas | `verifyComponentWithOutLabel('Button', 'button1', 'myBtn', 'myApp')` |
| - | `addValidations` | appBuilder/components/inputField.js | properties | `addValidations('input1', data)` |
| - | `addAndVerifyAdditionalActions` | appBuilder/components/inputField.js | properties | `addAndVerifyAdditionalActions('input1', 'help text')` |
| colorSwatches | `addAllInputFieldColors` | appBuilder/components/inputField.js | styles | `addAllInputFieldColors(data)` |
| colorSwatches | `verifyInputFieldColors` | appBuilder/components/inputField.js | styles | `verifyInputFieldColors('[data-cy="..."]', data)` |
| - | `verifyLabelStyleElements` | appBuilder/components/inputField.js | styles | `verifyLabelStyleElements()` |
| - | `verifyAlignment` | appBuilder/components/inputField.js | styles | `verifyAlignment('input1', 'topLeft', side)` |
| - | `verifyCustomWidthOfLabel` | appBuilder/components/inputField.js | styles | `verifyCustomWidthOfLabel('input1', 50)` |
| - | `addCustomWidthOfLabel` | appBuilder/components/inputField.js | styles | `addCustomWidthOfLabel(50)` |
| - | `verifyExistance` | appBuilder/components/properties/common.js | properties | `verifyExistance('[data-cy="draggable-widget-image1"]', 'exist')` |
| - | `genralProperties` | appBuilder/components/properties/common.js | properties | `genralProperties(compSel, controllerSel, { state: 'be.visible' })` |
| - | `selectDropdownOption` | appBuilder/components/properties/common.js | properties | `selectDropdownOption(dropdownSel, 'Cover')` |
| - | `setColorPickerValue` | appBuilder/components/properties/common.js | properties | `setColorPickerValue(pickerSel, '#FF0000')` |
| - | `setNumberInputValue` | appBuilder/components/properties/common.js | properties | `setNumberInputValue(inputSel, 24)` |
| - | `verifyVisibility` | appBuilder/components/properties/common.js | properties | `verifyVisibility(compSel, { toggle, csa, jsSet, jsReset })` |
| - | `verifyLoadingState` | appBuilder/components/properties/common.js | properties | `verifyLoadingState(compSel, { toggle, csa, jsSet, jsReset })` |
| - | `verifyDisability` | appBuilder/components/properties/common.js | properties | `verifyDisability(compSel, { csa, jsSet, jsReset })` |
| - | `verifyZoomFeature` | appBuilder/components/properties/imageComponent.js | properties | `verifyZoomFeature(compSel, zoomToggleSel)` |
| - | `verifyRotateFeature` | appBuilder/components/properties/imageComponent.js | properties | `verifyRotateFeature(compSel, rotateToggleSel)` |
| - | `verifyBorderType` | appBuilder/components/properties/imageComponent.js | properties | `verifyBorderType(compSel, dropdownSel, [{ label: 'Rounded', css: { 'border-radius': '8px' } }])` |
| - | `verifyImageLabel` | appBuilder/components/properties/imageComponent.js | properties | `verifyImageLabel(compSel, inputSel, [{ input: 10, styles: ['padding'] }])` |
| - | `verifyImageBackgroundColor` | appBuilder/components/properties/imageComponent.js | properties | `verifyImageBackgroundColor(compSel, pickerSel, [{ hex: '#FF0000', expectedBg: 'rgb(255, 0, 0)' }])` |
| - | `verifyImageFit` | appBuilder/components/properties/imageComponent.js | properties | `verifyImageFit(compSel, dropdownSel, [{ label: 'Cover', value: 'cover' }])` |
| - | `verifyImageFitAndBorderType` | appBuilder/components/properties/imageComponent.js | properties | `verifyImageFitAndBorderType(compSel, fitSel, borderSel, fitOptions, borderOptions)` |
