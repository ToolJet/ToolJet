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
| events | `selectEvent` | events.js | events | `selectEvent('On click', 'Show Alert')` |
| csa | `selectCSA` | events.js | csa | `selectCSA('textinput1', 'Set text')` |
| - | `addSupportCSAData` | events.js | csa | `addSupportCSAData('alert-message', 'Hello world')` |
| - | `selectSupportCSAData` | events.js | csa | `selectSupportCSAData('First option')` |
| - | `changeEventType` | events.js | events | `changeEventType('On blur', 0)` |
| events | `addMultiEventsWithAlert` | events.js | events | `addMultiEventsWithAlert([{ event: 'On click', message: 'clicked' }])` |
| - | `setCSAParam` | events.js | csa | `setCSAParam({ label: 'Column key', type: 'toggle', value: true })` |
| csa | `configureCSA` | events.js | csa | `configureCSA('textinput1', 'Set text', [{ label: 'text', value: '{{"hi"}}' }])` |
| - | `verifyControlComponentAction` | editor/textInput.js | csa | `verifyControlComponentAction('textinput1', 'hello')` |
| - | `randomString` | editor/textInput.js | common | `randomString(8)` |
| csa | `verifyCSA` | editor/textInput.js | csa | `verifyCSA('textinput1')` |
| csa | `addCSA` | editor/textInput.js | csa | `addCSA('textinput1', [{ event: 'On click', action: 'Set text', value: 'hello' }])` |
