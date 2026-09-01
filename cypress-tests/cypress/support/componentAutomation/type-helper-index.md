# type-helper-index (AUTO-GENERATED — do not edit)

| config type | helper | file | block | usage |
|---|---|---|---|---|
| - | `closeAccordions` | appbuilder/properties.js | common | `closeAccordions(['General', 'Properties'], '0')` |
| - | `openAccordion` | appbuilder/properties.js | common | `openAccordion('Properties', ['General'], '0')` |
| - | `openEditorSidebar` | appbuilder/properties.js | common | `openEditorSidebar('textinput1')` |
| code | `verifyAndModifyParameter` | appbuilder/properties.js | properties | `verifyAndModifyParameter('Text', 'Hello World')` |
| toggle | `verifyAndModifyToggleFx` | appbuilder/properties.js | properties | `verifyAndModifyToggleFx('Loading state', '{{false}}')` |
| switch | `verifyAndModifySwitch` | appbuilder/properties.js | properties | `verifyAndModifySwitch('Default state', 'On')` |
| - | `verifyTooltip` | appbuilder/properties.js | properties | `verifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')` |
| - | `addAndVerifyTooltip` | appbuilder/properties.js | properties | `addAndVerifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')` |
| - | `editAndVerifyWidgetName` | appbuilder/properties.js | properties | `editAndVerifyWidgetName('myButton', ['General', 'Properties', 'Devices'])` |
| - | `verifyPropertiesGeneralAccordion` | appbuilder/properties.js | properties | `verifyPropertiesGeneralAccordion('textinput1', 'Enter your name')` |
| - | `selectFromSidebarDropdown` | appbuilder/properties.js | properties | `selectFromSidebarDropdown('Alignment', 'center')` |
| - | `addValueOnInput` | appbuilder/properties.js | properties | `addValueOnInput('Border radius', '8')` |
| colorSwatches | `selectColourFromColourPicker` | appbuilder/styles.js | styles | `selectColourFromColourPicker('Background', ['255','0','0','100'])` |
| boxShadow | `fillBoxShadowParams` | appbuilder/styles.js | styles | `fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], [2, 4, 6, 0])` |
| boxShadow | `verifyBoxShadowCss` | appbuilder/styles.js | styles | `verifyBoxShadowCss('textinput1', [0,0,0,1], [2,4,6,0])` |
| - | `verifyAndModifyStylePickerFx` | appbuilder/styles.js | styles | `verifyAndModifyStylePickerFx('Border radius', '0', '4px')` |
| colorSwatches | `verifyWidgetColorCss` | appbuilder/styles.js | styles | `verifyWidgetColorCss('textinput1', 'background-color', ['255','0','0','100'])` |
| - | `verifyLoaderColor` | appbuilder/styles.js | styles | `verifyLoaderColor('button1', ['255','0','0','100'])` |
| - | `verifyStylesGeneralAccordion` | appbuilder/styles.js | styles | `verifyStylesGeneralAccordion('textinput1', [2,4,6,0], '#ff0000', [255,0,0,100])` |
| - | `checkPaddingOfContainer` | appbuilder/styles.js | styles | `checkPaddingOfContainer('container1', '16', 'Box')` |
| - | `verifyWidgetText` | appbuilder/components.js | properties | `verifyWidgetText('textinput1', 'Hello')` |
| - | `addTextWidgetToVerifyValue` | appbuilder/components.js | canvas | `addTextWidgetToVerifyValue('components.textinput1.value')` |
| - | `verifyContainerElements` | appbuilder/components.js | properties | `verifyContainerElements()` |
| toggle | `verifyLayout` | appbuilder/layout.js | properties | `verifyLayout('textinput1')` |
| exposed | `openAndVerifyNode` | appbuilder/inspectorTree.js | inspector | `openAndVerifyNode('textinput1', nodes, verifyNodeData)` |
| exposed | `verifyNodes` | appbuilder/inspectorTree.js | inspector | `verifyNodes([{ key: 'value', type: 'string', value: 'hello' }], verifyNodeData)` |
| exposed | `openNode` | appbuilder/inspectorTree.js | inspector | `openNode('components', 0)` |
| - | `openSubNode` | appbuilder/inspectorTree.js | inspector | `openSubNode('textinput1', 'components')` |
| - | `backFromDetail` | appbuilder/inspectorTree.js | common | `backFromDetail()` |
| - | `openSubNodeAndVerify` | appbuilder/inspectorTree.js | inspector | `openSubNodeAndVerify('globals', 'currentUser', nodes, verifyNodeData)` |
| - | `openStateFromComponent` | appbuilder/inspectorTree.js | inspector | `openStateFromComponent('textinput1')` |
| exposed | `verifyNodeData` | appbuilder/inspectorTree.js | inspector | `verifyNodeData('value', 'string', 'hello', 0)` |
| - | `deleteComponentFromInspector` | appbuilder/inspectorTree.js | inspector | `deleteComponentFromInspector('textinput1')` |
| - | `navigateToInspectorNodes` | appbuilder/inspectorTree.js | inspector | `navigateToInspectorNodes(['globals', 'currentUser', 'email'])` |
| - | `verifyInspectorValue` | appbuilder/inspectorTree.js | inspector | `verifyInspectorValue('currentUser', 'admin')` |
| - | `verifyInspectorKeyValue` | appbuilder/inspectorTree.js | inspector | `verifyInspectorKeyValue('isValid', 'true')` |
| - | `navigateAndVerifyInspector` | appbuilder/inspectorTree.js | inspector | `navigateAndVerifyInspector(['globals','currentUser','firstName'], [['firstName','Admin']])` |
| - | `verifyComponentValueFromInspector` | appbuilder/inspectorTree.js | inspector | `verifyComponentValueFromInspector('textinput1', 'hello')` |
| - | `verifyMultipleComponentValuesFromInspector` | appbuilder/inspectorTree.js | inspector | `verifyMultipleComponentValuesFromInspector('select1', ['opt1', 'opt2'])` |
| - | `verifyComponentFromInspector` | appbuilder/inspectorTree.js | inspector | `verifyComponentFromInspector('textinput1')` |
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
