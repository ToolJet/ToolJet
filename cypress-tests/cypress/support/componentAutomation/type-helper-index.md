# type-helper-index (AUTO-GENERATED — do not edit)

| config type | helper | file | block | usage |
|---|---|---|---|---|
| - | `openAccordion` | commonWidget.js | common | `openAccordion('Properties', ['General'], '0')` |
| code | `verifyAndModifyParameter` | commonWidget.js | properties | `verifyAndModifyParameter('Text', 'Hello World')` |
| - | `openEditorSidebar` | commonWidget.js | common | `openEditorSidebar('textinput1')` |
| toggle | `verifyAndModifyToggleFx` | commonWidget.js | properties | `verifyAndModifyToggleFx('Loading state', '{{false}}')` |
| - | `addDefaultEventHandler` | commonWidget.js | events | `addDefaultEventHandler('Button clicked!')` |
| - | `addAndVerifyTooltip` | commonWidget.js | properties | `addAndVerifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')` |
| - | `editAndVerifyWidgetName` | commonWidget.js | properties | `editAndVerifyWidgetName('myButton', ['General', 'Properties', 'Devices'])` |
| - | `verifyComponentValueFromInspector` | commonWidget.js | inspector | `verifyComponentValueFromInspector('textinput1', 'hello')` |
| - | `verifyMultipleComponentValuesFromInspector` | commonWidget.js | inspector | `verifyMultipleComponentValuesFromInspector('select1', ['opt1', 'opt2'])` |
| colorSwatches | `selectColourFromColourPicker` | commonWidget.js | styles | `selectColourFromColourPicker('Background', ['255','0','0','100'])` |
| boxShadow | `fillBoxShadowParams` | commonWidget.js | styles | `fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], [2, 4, 6, 0])` |
| boxShadow | `verifyBoxShadowCss` | commonWidget.js | styles | `verifyBoxShadowCss('textinput1', [0,0,0,1], [2,4,6,0])` |
| - | `verifyComponentFromInspector` | commonWidget.js | inspector | `verifyComponentFromInspector('textinput1')` |
| styleFx | `verifyAndModifyStylePickerFx` | commonWidget.js | styles | `verifyAndModifyStylePickerFx('Border radius', '0', '4px')` |
| colorSwatches | `verifyWidgetColorCss` | commonWidget.js | styles | `verifyWidgetColorCss('textinput1', 'background-color', ['255','0','0','100'])` |
| - | `verifyLoaderColor` | commonWidget.js | styles | `verifyLoaderColor('button1', ['255','0','0','100'])` |
| toggle | `verifyLayout` | commonWidget.js | properties | `verifyLayout('textinput1')` |
| - | `verifyPropertiesGeneralAccordion` | commonWidget.js | properties | `verifyPropertiesGeneralAccordion('textinput1', 'Enter your name')` |
| - | `verifyStylesGeneralAccordion` | commonWidget.js | styles | `verifyStylesGeneralAccordion('textinput1', [2,4,6,0], '#ff0000', [255,0,0,100])` |
| - | `addTextWidgetToVerifyValue` | commonWidget.js | canvas | `addTextWidgetToVerifyValue('components.textinput1.value')` |
| - | `verifyTooltip` | commonWidget.js | properties | `verifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')` |
| - | `verifyWidgetText` | commonWidget.js | properties | `verifyWidgetText('textinput1', 'Hello')` |
| - | `randomNumber` | commonWidget.js | common | `randomNumber(1, 100)` |
| - | `pushIntoArrayOfObject` | commonWidget.js | common | `pushIntoArrayOfObject(['Alice','Bob'], [90, 85])` |
| - | `closeAccordions` | commonWidget.js | common | `closeAccordions(['General', 'Properties'], '0')` |
| - | `selectFromSidebarDropdown` | commonWidget.js | properties | `selectFromSidebarDropdown('Alignment', 'center')` |
| - | `addValueOnInput` | commonWidget.js | properties | `addValueOnInput('Border radius', '8')` |
| - | `verifyContainerElements` | commonWidget.js | properties | `verifyContainerElements()` |
| - | `checkPaddingOfContainer` | commonWidget.js | styles | `checkPaddingOfContainer('container1', '16', 'Box')` |
| events | `selectEvent` | events.js | events | `selectEvent('On click', 'Show Alert', 0, '[data-cy="add-event-handler"]', 0)` |
| csa | `selectCSA` | events.js | csa | `selectCSA('textinput1', 'Set text')` |
| - | `addSupportCSAData` | events.js | csa | `addSupportCSAData('alert-message', 'Done!')` |
| - | `selectSupportCSAData` | events.js | csa | `selectSupportCSAData('Clear value')` |
| - | `changeEventType` | events.js | events | `changeEventType('On mouse over', 0)` |
| events | `addMultiEventsWithAlert` | events.js | events | `addMultiEventsWithAlert([{ event: 'On click', message: 'Clicked!' }])` |
| - | `verifyControlComponentAction` | editor/textInput.js | csa | `verifyControlComponentAction('textinput1', 'hello')` |
| - | `randomString` | editor/textInput.js | common | `randomString(8)` |
| csa | `verifyCSA` | editor/textInput.js | csa | `verifyCSA('textinput1')` |
| csa | `addCSA` | editor/textInput.js | csa | `addCSA('textinput1', [{ event: 'On click', action: 'Set text', value: 'hello' }])` |
| exposed | `openAndVerifyNode` | inspector.js | inspector | `openAndVerifyNode('textinput1', nodes, verifyNodeData)` |
| exposed | `verifyNodes` | inspector.js | inspector | `verifyNodes([{ key: 'value', type: 'string', value: 'hello' }], verifyNodeData)` |
| exposed | `openNode` | inspector.js | inspector | `openNode('components', 0)` |
| - | `openSubNode` | inspector.js | inspector | `openSubNode('textinput1', 'components')` |
| - | `backFromDetail` | inspector.js | common | `backFromDetail()` |
| - | `openSubNodeAndVerify` | inspector.js | inspector | `openSubNodeAndVerify('globals', 'currentUser', nodes, verifyNodeData)` |
| - | `openStateFromComponent` | inspector.js | inspector | `openStateFromComponent('textinput1')` |
| exposed | `verifyNodeData` | inspector.js | inspector | `verifyNodeData('value', 'string', 'hello', 0)` |
| - | `deleteComponentFromInspector` | inspector.js | inspector | `deleteComponentFromInspector('textinput1')` |
| - | `navigateToInspectorNodes` | inspector.js | inspector | `navigateToInspectorNodes(['globals', 'currentUser', 'email'])` |
| - | `verifyInspectorValue` | inspector.js | inspector | `verifyInspectorValue('currentUser', 'admin')` |
| - | `verifyInspectorKeyValue` | inspector.js | inspector | `verifyInspectorKeyValue('isValid', 'true')` |
| - | `navigateAndVerifyInspector` | inspector.js | inspector | `navigateAndVerifyInspector(['globals','currentUser','firstName'], [['firstName','Admin']])` |
