import { fake } from "Fixtures/fake";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { tableText } from "Texts/table";
import { tableSelector } from "Selectors/table";
import {
  searchOnTable,
  verifyTableElements,
  selectDropdownOption,
  deleteAndVerifyColumn,
  addAndOpenColumnOption,
  verifyAndEnterColumnOptionInput,
  verifyInvalidFeedback,
  addInputOnTable,
  verifySingleValueOnTable,
  verifyAndModifyToggleFx,
  selectFromSidebarDropdown,
  dataPdfAssertionHelper,
  dataCsvAssertionHelper,
  addFilter,
} from "Support/utils/table";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  // verifyAndModifyToggleFx,
  verifyComponentValueFromInspector,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  addTextWidgetToVerifyValue,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  fillBoxShadowParams,
  selectColourFromColourPicker,
  closeAccordions,
} from "Support/utils/commonWidget";

describe("Table", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.modifyCanvasSize(900, 900);
    cy.dragAndDropWidget("Table", 50, 50);
    cy.resizeWidget(tableText.defaultWidgetName, 850, 600);
  });

  it("Should verify the table components and labels", () => {
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("be.visible");

    cy.get(tableSelector.searchInputField)
      .should("be.visible")
      .invoke("attr", "placeholder")
      .should("contain", tableText.placeHolderSearch);
    searchOnTable(tableText.defaultInput[0].email);
    cy.get(tableSelector.column(2))
      .eq("0")
      .should("have.text", tableText.defaultInput[0].email);
    searchOnTable();

    cy.get(tableSelector.pageIndexDetails).verifyVisibleElement(
      "have.text",
      tableText.defaultPageIndexDetails
    );
    cy.get(tableSelector.paginationButtonToFirst).should("be.visible");
    cy.get(tableSelector.paginationButtonToPrevious).should("be.visible");
    cy.get(tableSelector.paginationButtonToNext).should("be.visible");
    cy.get(tableSelector.paginationButtonToLast).should("be.visible");
    cy.get(tableSelector.labelNumberOfRecords).verifyVisibleElement(
      "have.text",
      tableText.defaultNumberOfRecords
    );

    cy.get(tableSelector.buttonDownloadDropdown).should("be.visible").click();
    cy.get(tableSelector.optionDownloadCSV).verifyVisibleElement(
      "have.text",
      tableText.optionDownloadCSV
    );
    cy.get(tableSelector.optionDownloadExcel).verifyVisibleElement(
      "have.text",
      tableText.optionDownloadExcel
    );

    cy.get(tableSelector.selectColumnDropdown).should("be.visible").click();

    cy.get(tableSelector.selectColumnCheckbox(tableText.id))
      .should("be.visible")
      .and("be.checked");
    cy.get(tableSelector.selectColumnCheckbox(tableText.name))
      .should("be.visible")
      .and("be.checked");
    cy.get(tableSelector.selectColumnCheckbox(tableText.email))
      .should("be.visible")
      .and("be.checked");
    cy.get(tableSelector.selectAllOption).verifyVisibleElement(
      "have.text",
      tableText.oprionSelectAll
    );
    cy.get(tableSelector.selectColumnOption(tableText.id)).verifyVisibleElement(
      "have.text",
      ` ${tableText.id}`
    );
    cy.get(
      tableSelector.selectColumnOption(tableText.name)
    ).verifyVisibleElement("have.text", ` ${tableText.name}`);
    cy.get(
      tableSelector.selectColumnOption(tableText.email)
    ).verifyVisibleElement("have.text", ` ${tableText.email}`);

    cy.get(tableSelector.selectColumnCheckbox(tableText.id)).click();
    cy.notVisible(tableSelector.columnHeader(tableText.id));
    cy.get(tableSelector.selectColumnCheckbox(tableText.id)).click();
    cy.get(tableSelector.columnHeader(tableText.id)).should("be.visible");

    cy.get(tableSelector.filterButton).click();
    cy.get(tableSelector.headerFilters).verifyVisibleElement(
      "have.text",
      tableText.headerFilters
    );
    cy.get(tableSelector.labelNoFilters).verifyVisibleElement(
      "have.text",
      tableText.labelNoFilters
    );
    cy.get(tableSelector.buttonAddFilter).verifyVisibleElement(
      "have.text",
      tableText.buttonLabelAddFilter
    );
    cy.get(tableSelector.buttonClearFilter).verifyVisibleElement(
      "have.text",
      tableText.buttonLabelClearFilters
    );
    cy.get(tableSelector.buttonCloseFilters).should("be.visible");

    cy.get(tableSelector.buttonAddFilter).realClick().realClick();

    cy.get(tableSelector.labelColumn).verifyVisibleElement(
      "have.text",
      tableText.labelColumn
    );
    cy.get(tableSelector.labelAnd()).verifyVisibleElement(
      "have.text",
      tableText.labelAnd
    );

    cy.get(tableSelector.filterSelectColumn(0)).should("be.visible");
    cy.get(tableSelector.filterSelectOperation(0)).should("be.visible");
    cy.get(tableSelector.filterInput(0)).should("be.visible");
    cy.get(tableSelector.filterClose(0)).should("be.visible");

    cy.get(tableSelector.filterSelectColumn(0))
      .click()
      .type(`${tableText.email}{enter}`);
    cy.get(tableSelector.filterSelectOperation(0))
      .click()
      .type(`${tableText.optionEquals}{enter}`);
    cy.get(tableSelector.filterInput(0)).type(tableText.defaultInput[1].email);
    cy.get(tableSelector.filterClose(1)).click();
    cy.notVisible(tableSelector.filterClose(1));

    cy.get(tableSelector.buttonCloseFilters).click();
    cy.get(tableSelector.column(2)).each(($el) => {
      cy.wrap($el).should("have.text", tableText.defaultInput[1].email);
    });

    cy.get(tableSelector.filterButton).click();

    cy.get(tableSelector.filterClose(0)).click();
    cy.get(tableSelector.buttonCloseFilters).click();
    cy.get(tableSelector.column(2))
      .eq(0)
      .should("have.text", tableText.defaultInput[0].email);

    cy.get(tableSelector.column(0)).each(($el, index) => {
      cy.wrap($el).should("have.text", index + 1);
    });

    cy.get(tableSelector.columnHeader(tableText.id)).dblclick();
    cy.get(tableSelector.column(0)).each(($el, index) => {
      cy.wrap($el).should("have.text", 4 - index);
    });
  });

  it("should verify the sidebar element", () => {
    const data = {};
    data.widgetName = fake.widgetName;
    openEditorSidebar(tableText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName, [
      "Options",
      "Properties",
      "Columns",
      "Layout",
    ]);
    cy.forceClickOnCanvas();

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Options",
      "Columns",
      "Layout",
    ]);
    verifyAndModifyParameter(
      "Table data",
      codeMirrorInputLabel(`[{id:1,name:"Mike",email:"mike@example.com" },{id:2,name:"Nina",email:"nina@example.com" },{id:3,name:"Steph",email:"steph@example.com" },{id:4,name:"Oliver",email:"oliver@example.com" },
      ]`)
    );
    // cy.get('[data-cy="inspector-close-icon"]').click();
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    verifyTableElements([
      { id: 1, name: "Mike", email: "mike@example.com" },
      { id: 2, name: "Nina", email: "nina@example.com" },
      { id: 3, name: "Steph", email: "steph@example.com" },
      { id: 4, name: "Oliver", email: "oliver@example.com" },
    ]);
    cy.get('[data-cy="inspector-close-icon"]').click();
    openEditorSidebar(data.widgetName);
    openAccordion("Columns", ["Options", "Properties", "Layout"]);
    deleteAndVerifyColumn("email");
    openEditorSidebar(data.widgetName);
    openAccordion("Action buttons", [
      "Options",
      "Properties",
      "Columns",
      "Layout",
    ]);
    cy.get('[data-cy="message-no-action-button"]').should(
      "have.text",
      "This table doesn't have any action buttons"
    );
    cy.get('[data-cy="button-add-new-action-button"]')
      .should("have.text", "+ Add button")
      .click();
    cy.get('[data-cy="action-button-button-0"]').verifyVisibleElement(
      "have.text",
      "Button"
    );

    // cy.get('[data-cy="real-canvas"]').scrollTo("right");
    // cy.pause();
    // cy.get('[data-cy="real-canvas"]').scrollTo("right");
    // cy.pause();
    // cy.get(tableSelector.columnHeader("Actions"))
    //   .scrollIntoView()
    //   .verifyVisibleElement("have.text", "Actions");

    cy.get('[data-cy="action-button-button-0"]').click();

    cy.get('[data-cy="label-action-button-text"]').verifyVisibleElement(
      "have.text",
      "Button Text"
    );
    cy.get('[data-cy="action-button-text-input-field"]').type(
      "{selectAll}{backspace}FakeName1"
    );
    cy.get('[data-cy="action-button-fakename1-0"]').should(
      "have.text",
      "FakeName1"
    );
    cy.get('[data-cy="label-action-button-position"]').verifyVisibleElement(
      "have.text",
      "Button Position"
    ); // dropdown_type

    cy.get('[data-cy="rightActions-cell-2"]')
      .eq(0)
      .should("have.text", "FakeName1");
    cy.get(`[data-cy="dropdown-action-button-position"]>>:eq(0)`).click();
    cy.get('[data-index="0"] > .select-search-option').click();

    cy.get('[data-cy="leftActions-cell-0"]')
      .eq(0)
      .should("have.text", "FakeName1");
    cy.get('[data-cy*="action-button-fakename1"]').verifyVisibleElement(
      "have.text",
      "FakeName1"
    );

    cy.get('[data-cy="add-event-handler"]').eq(1).click();
    cy.get('[data-cy="leftActions-cell-0"]').eq(0).find("button").click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents, [
      "Options",
      "Properties",
      "Columns",
      "Layout",
    ]);
    cy.get('[data-cy="add-event-handler"]').click();
    cy.get('[data-cy="event-handler-card"]').click();
    cy.get('[data-cy="event-selection"]>')
      .click()
      .find("input")
      .type(`Row clicked{enter}`);
    cy.get('[data-cy*="-cell-1"]').eq(0).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    cy.get('[data-cy="inspector-close-icon"]').click();

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionLayout, [
      "Options",
      "Properties",
      "Columns",
    ]);

    verifyAndModifyToggleFx(
      "Show on desktop",
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "not.exist"
    );

    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnMobile,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get('[data-cy="button-change-layout-to-mobile"]').click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "exist"
    );
  });

  it("should verify column options", () => {
    const data = {};
    data.widgetName = fake.widgetName;
    openEditorSidebar(tableText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName, [
      "Options",
      "Properties",
      "Columns",
      "Layout",
    ]);

    //String/default
    openEditorSidebar(data.widgetName);
    deleteAndVerifyColumn("id");
    deleteAndVerifyColumn("name");
    deleteAndVerifyColumn("email");
    addAndOpenColumnOption("Fake-String", `string`);
    selectDropdownOption('[data-cy="input-overflow"] >>:eq(0)', `wrap`);
    cy.get('[data-index="0"]>.select-search-option:eq(1)').realClick();
    cy.wait(2000);
    verifyAndEnterColumnOptionInput("key", "name");
    verifyAndEnterColumnOptionInput("Text color", "red");
    verifyAndEnterColumnOptionInput(
      "Cell Background Color",
      "{backspace}{backspace}{backspace}{backspace}{backspace}yellow"
    );
    cy.get(
      '[data-cy="input-and-label-cell-background-color"] > .form-label'
    ).click();
    cy.wait(500);

    cy.get(tableSelector.column(0))
      .eq(0)
      .should("have.css", "background-color", "rgb(255, 255, 0)", {
        timeout: 10000,
      })
      .last()
      .should("have.css", "color", "rgb(62, 82, 91)")
      .and("have.text", "Sarah");

    cy.get('[data-cy="make-editable-toggle-button"]').click();
    cy.get('[data-cy="header-validation"]').verifyVisibleElement(
      "have.text",
      "Validation"
    );
    verifyAndEnterColumnOptionInput("Regex", "AABb");
    verifyAndEnterColumnOptionInput("Min length", "4");
    verifyAndEnterColumnOptionInput("Max length", "5");
    verifyAndEnterColumnOptionInput("Custom rule", "{backspace}");
    verifyInvalidFeedback(0, 0, "The input should match pattern");
    addInputOnTable(0, 0, "AABb");

    // cy.notVisible('[data-cy="stringsarah-cell-0"] >>>.invalid-feedback');
    openEditorSidebar(data.widgetName);
    deleteAndVerifyColumn("Fake-String");

    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-number", `number`);
    verifyAndEnterColumnOptionInput("key", "id");
    // verifyAndEnterColumnOptionInput("Cell Background Color", "black");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    cy.get('[data-cy="header-validation"]').verifyVisibleElement(
      "have.text",
      "Validation"
    );

    verifyAndEnterColumnOptionInput("Min value", "2");
    verifyAndEnterColumnOptionInput("Max value", "3");
    addInputOnTable(0, 0, "0");
    verifyInvalidFeedback(0, 0, "Minimum value is 2");
    verifyInvalidFeedback(0, 3, "Maximum value is 3");
    openEditorSidebar(data.widgetName);
    deleteAndVerifyColumn("fake-number");

    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-text", `text`);
    verifyAndEnterColumnOptionInput("key", "email");
    // verifyAndEnterColumnOptionInput("Cell Background Color", "");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    verifySingleValueOnTable(0, 0, "sarah@example.com");
    addInputOnTable(0, 0, "mike@example.com", "textarea");
    openEditorSidebar(data.widgetName);
    deleteAndVerifyColumn("fake-text");

    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-badge", `badge`);
    verifyAndEnterColumnOptionInput("key", "");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    selectDropdownOption(`${tableSelector.column(0)}:eq(0) .badge`, 1);
    cy.get(`${tableSelector.column(0)}:eq(0) .badge`).should(
      "have.text",
      "Two"
    );
    deleteAndVerifyColumn("fake-badge");

    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-multiple-badge", `multipleBadges`);

    verifyAndEnterColumnOptionInput("key", "id");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');
    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    selectDropdownOption(`${tableSelector.column(0)}:eq(0) .badge`, 1); // WIP (workaround needed)
    cy.get(`${tableSelector.column(0)}:eq(1) .badge`).should(
      "have.text",
      "Two"
    );
    selectDropdownOption(`${tableSelector.column(0)}:eq(0) .badge`, 0);
    cy.get(`${tableSelector.column(0)}:eq(0) .badge`).should(
      "have.text",
      "TwoOne"
    );
    selectDropdownOption(`${tableSelector.column(0)}:eq(1) .badge`, 1);
    cy.get(`${tableSelector.column(0)}:eq(0) .badge`).should(
      "have.text",
      "One"
    );
    deleteAndVerifyColumn("fake-multiple-badge");

    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(
      "Table data",
      codeMirrorInputLabel(`[{id:1,name:"Mike",email:"mike@example.com", tags:['One','Two','Three'] },{id:2,name:"Nina",email:"nina@example.com" },{id:3,name:"Steph",email:"steph@example.com", tags:['One','Two','Three'] },{id:4,name:"Oliver",email:"oliver@example.com" },
      ]`)
    );
    closeAccordions(["Options"]);
    addAndOpenColumnOption("fake-tags", `tags`);
    verifyAndEnterColumnOptionInput("key", "tags");

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    //WIP Not editble verify
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    cy.forceClickOnCanvas();

    cy.get(`${tableSelector.column(0)}:eq(0) .badge`)
      .eq(0)
      .should("have.text", "Onex")
      .next()
      .should("have.text", "Twox")
      .next()
      .should("have.text", "Threex");
    cy.get(`${tableSelector.column(0)}:eq(0) .badge`)
      .first()
      .click({ force: true })
      .trigger("mouseover")
      .trigger("mouseenter")
      .find(`[class="badge badge-pill bg-red-lt remove-tag-button"]`)
      .invoke("show")
      .dblclick();
    cy.wait(5000);
    deleteAndVerifyColumn("fake-tags");

    openEditorSidebar(data.widgetName);
    // verifyAndModifyParameter(
    //   "Table data",
    //   codeMirrorInputLabel(`[{id:1,name:"Mike",email:"mike@example.com", tags:['One','Two','Three'] },{id:2,name:"Nina",email:"nina@example.com" },{id:3,name:"Steph",email:"steph@example.com", tags:['One','Two','Three'] },{id:4,name:"Oliver",email:"oliver@example.com" },
    //   ]`)
    // );
    // closeAccordions(["Properties"]);
    addAndOpenColumnOption("fake-dropdown", `dropdown`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    verifyAndEnterColumnOptionInput("Custom rule", "fakeString");

    deleteAndVerifyColumn("fake-dropdown");

    //VerifyDropdown
    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-radio", `radio`);

    verifyAndEnterColumnOptionInput("key", "");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    // //verifyRadio
    deleteAndVerifyColumn("fake-radio");

    // openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-multiselect", `multiselect`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    // //verify multiselect
    deleteAndVerifyColumn("fake-multiselect");

    // openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-toggleSwitch", `toggleSwitch`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    // verifyAndEnterColumnOptionInput("Active color", "green"); //use color Picker
    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    deleteAndVerifyColumn("fake-toggleSwitch");

    // //Toggle Switch
    // openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-datePicker", `datePicker`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    // verifyAndEnterColumnOptionInput("Date Display format", "fakeString");
    // verifyAndEnterColumnOptionInput("Cell Background Color", "blue");
    cy.get('[data-cy="make-editable-toggle-button"]').click();

    // // verifyAndEnterColumnOptionInput("Date Parse Format", "fakeString");

    // // verifyAndEnterColumnOptionInput("Parse in timezone", "fakeString");

    // // verifyAndEnterColumnOptionInput("Display in timezone", "fakeString");
    deleteAndVerifyColumn("fake-datePicker");
  });

  it("should verify styles", () => {
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("be.visible");

    const data = {};
    data.color = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("not.be.visible");
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterVisibility
      )
    ).click();
    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.waitForAutoSave();
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("have.attr", "data-disabled", "true");
    cy.get("[data-cy='disable-toggle-button']").click();

    // cy.get("[data-cy='border-radius-fx-button']:eq(1)").click();
    verifyAndModifyParameter(
      "Action Button Radius",
      commonWidgetText.borderRadiusInput
    );

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(tableText.defaultWidgetName);
    openAccordion("Columns", ["Options", "Properties", "Layout"]);
    deleteAndVerifyColumn("email");
    openEditorSidebar(tableText.defaultWidgetName);
    openAccordion("Action buttons", [
      "Options",
      "Properties",
      "Columns",
      "Layout",
    ]);
    cy.get('[data-cy="button-add-new-action-button"]').click();

    cy.get('[data-cy="rightActions-cell-2"]')
      .eq(0)
      .find("button")
      .should("have.css", "border-radius", "20px");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyParameter(
      "Border Radius",
      commonWidgetText.borderRadiusInput
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, []);

    verifyAndModifyToggleFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
      false
    );

    cy.get(commonWidgetSelector.boxShadowColorPicker).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );

    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.color);
    verifyBoxShadowCss(
      tableText.defaultWidgetName,
      data.color,
      data.boxShadowParam
    );
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).click();
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    cy.get('[data-cy="label-table-type"]').verifyVisibleElement(
      "have.text",
      "Table type"
    );
    cy.get(
      '[data-cy="table-type-fx-button"][class*="fx-button  unselectable"]'
    ).click();
    cy.get('[data-cy="table-type-input-field"]').clearAndTypeOnCodeMirror(
      `randomText`
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .find("table")
      .invoke("attr", "class")
      .and("contain", "randomText");
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).click();
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    cy.get('[data-cy="table-type-fx-button"]').click();
    cy.get('[data-cy="dropdown-table-type"]').click();
    selectFromSidebarDropdown('[data-cy="dropdown-table-type"]', "Classic");
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .click()
      .find("table")
      .invoke("attr", "class")
      .and("contain", "classic");

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectFromSidebarDropdown(
      '[data-cy="dropdown-table-type"]',
      "Striped & bordered"
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .click()
      .find("table")
      .invoke("attr", "class")
      .and("contain", "table-striped table-bordered ");

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    cy.get('[data-cy="label-cell-size"]').verifyVisibleElement(
      "have.text",
      "Cell size"
    );
    cy.get(
      '[data-cy="cell-size-fx-button"][class*="fx-button  unselectable"]'
    ).click();

    cy.get('[data-cy="cell-size-input-field"]').clearAndTypeOnCodeMirror(
      `randomText`
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).click();
    cy.get(tableSelector.column(0))
      .eq(0)
      .invoke("attr", "class")
      .and("contain", "randomText");

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    cy.get('[data-cy="cell-size-fx-button"]').click();
    selectFromSidebarDropdown('[data-cy="dropdown-cell-size"]', "Spacious");
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).click();

    cy.get(tableSelector.column(0))
      .eq(0)
      .invoke("attr", "class")
      .and("contain", "spacious");

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    cy.get('[data-cy="label-text-color"]').verifyVisibleElement(
      "have.text",
      "Text color"
    );

    selectColourFromColourPicker(`Text color`, data.color);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .click()
      .find("tbody")
      .should(
        "have.css",
        "color",
        `rgba(${data.color[0]}, ${data.color[1]}, ${data.color[2]}, ${
          data.color[3] / 100
        })`
      );
  });

  it("should verify table options", () => {
    openEditorSidebar(tableText.defaultWidgetName);
    closeAccordions(["Action buttons", "Columns", "Properties"]);
    verifyAndModifyToggleFx("Client-side pagination", "{{true}}", true);
    cy.get('[data-cy="server-side-pagination-toggle-button"]').click();
    cy.get(tableSelector.paginationButtonToPrevious).should("be.visible");
    cy.get(tableSelector.paginationButtonToNext).should("be.visible");

    verifyAndModifyToggleFx("Enable previous page button", "{{true}}", true);
    cy.get(tableSelector.paginationButtonToPrevious).should("be.disabled");
    verifyAndModifyToggleFx("Enable next page button", "{{true}}", true);
    cy.get(tableSelector.paginationButtonToNext).should("be.disabled");
    cy.get('[data-cy="label-total-records-server-side"]').verifyVisibleElement(
      "have.text",
      "Total records server side"
    );
    cy.get('[data-cy="server-side-pagination-toggle-button"]').click();

    cy.get('[data-cy="client-side-pagination-toggle-button"]').click();

    cy.get('[data-cy="label-number-of-rows-per-page"]').verifyVisibleElement(
      "have.text",
      "Number of rows per page"
    );

    verifyAndModifyToggleFx("Enable sorting", "{{true}}", true); //inputfield
    cy.get('[data-cy="enable-sorting-toggle-button"]').click();
    verifyAndModifyToggleFx("Server-side sort", "{{false}}", true);

    verifyAndModifyToggleFx("Show download button", "{{true}}", true);
    cy.notVisible('[data-tooltip-id="tooltip-for-download"]');

    verifyAndModifyToggleFx("Show filter button", "{{true}}", true);
    cy.notVisible('[data-tooltip-id="tooltip-for-filter-data"]');

    cy.get('[data-cy="show-filter-button-toggle-button"]').click();
    verifyAndModifyToggleFx("Server-side filter", "{{false}}", true);
    verifyAndModifyToggleFx("Show update buttons", "{{true}}", true);
    verifyAndModifyToggleFx("Bulk selection", "{{false}}", true);
    cy.get('[data-cy="checkbox-input"]').should("be.visible");

    verifyAndModifyToggleFx("Highlight selected row", "{{false}}", true);
    verifyAndModifyToggleFx("Hide column selector button", "{{false}}", true);
    cy.notVisible('[data-cy="select-column-icon"]');

    verifyAndModifyToggleFx("Show search box", "{{true}}", true);
    cy.notVisible('[data-cy="search-input-field"]');

    cy.get('[data-cy="show-search-box-toggle-button"]').click();

    verifyAndModifyToggleFx("Server-side search", "", true);
    verifyAndModifyToggleFx("Loading State", "{{false}}", true);
  });

  it("should verify download", () => {
    cy.get(tableSelector.buttonDownloadDropdown).should("be.visible").click();
    cy.get(tableSelector.optionDownloadPdf).click();
    cy.task("readPdf", "cypress/downloads/all-data.pdf")
      .should("contain", dataPdfAssertionHelper(tableText.defaultInput)[0])
      .and("contain", dataPdfAssertionHelper(tableText.defaultInput)[1])
      .and("contain", dataPdfAssertionHelper(tableText.defaultInput)[2]);

    cy.get(tableSelector.optionDownloadCSV).click();
    cy.readFile("cypress/downloads/all-data.csv", "utf-8")
      .should("contain", dataCsvAssertionHelper(tableText.defaultInput)[0])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[1])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[2]);
    cy.get(tableSelector.optionDownloadExcel).click();
    cy.task("readXlsx", "cypress/downloads/all-data.xlsx")
      .should("contain", dataCsvAssertionHelper(tableText.defaultInput)[0])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[1])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[2]);
  });

  it("Should verify the table filter options", () => {
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("be.visible");
    cy.get(tableSelector.filterButton).click();
    addFilter(
      [{ column: "name", operation: "contains", value: "Sarah" }],
      true
    );
    verifyTableElements([{ id: 1, name: "Sarah", email: "sarah@example.com" }]);

    addFilter([
      { column: "name", operation: "does not contains", value: "Sarah" },
    ]);
    verifyTableElements([
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
      { id: 4, name: "Jon", email: "jon@example.com" },
    ]);

    addFilter([
      { column: "email", operation: "matches", value: "jon@example.com" },
    ]);
    verifyTableElements([{ id: 4, name: "Jon", email: "jon@example.com" }]);

    addFilter([
      {
        column: "email",
        operation: "does not match",
        value: "jon@example.com",
      },
    ]);
    verifyTableElements([
      { id: 1, name: "Sarah", email: "sarah@example.com" },
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
    ]);

    addFilter([{ column: "id", operation: "equals", value: "3" }]);
    verifyTableElements([{ id: 3, name: "Sam", email: "sam@example.com" }]);

    addFilter([{ column: "id", operation: "does not equal", value: "3" }]);
    verifyTableElements([
      { id: 1, name: "Sarah", email: "sarah@example.com" },
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 4, name: "Jon", email: "jon@example.com" },
    ]);

    addFilter([{ column: "id", operation: "greater than", value: "1" }]);
    verifyTableElements([
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
      { id: 4, name: "Jon", email: "jon@example.com" },
    ]);

    addFilter([{ column: "id", operation: "less than", value: "3" }]);
    verifyTableElements([
      { id: 1, name: "Sarah", email: "sarah@example.com" },
      { id: 2, name: "Lisa", email: "lisa@example.com" },
    ]);

    addFilter([
      { column: "id", operation: "greater than or equals", value: "1" },
    ]);
    verifyTableElements([
      { id: 1, name: "Sarah", email: "sarah@example.com" },
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
      { id: 4, name: "Jon", email: "jon@example.com" },
    ]);

    addFilter([{ column: "id", operation: "less than or equals", value: "3" }]);
    verifyTableElements([
      { id: 1, name: "Sarah", email: "sarah@example.com" },
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
    ]);

    addFilter(
      [
        { column: "id", operation: "greater than or equals", value: "2" },
        { column: "email", operation: "contains", value: "Sa" },
      ],
      true
    );
    verifyTableElements([
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
    ]);

    addFilter(
      [
        { column: "id", operation: "greater than or equals", value: "1" },
        { column: "email", operation: "does not contains", value: "Sa" },
      ],
      true
    );
    verifyTableElements([{ id: 4, name: "Jon", email: "jon@example.com" }]);

    addFilter([{ column: "id", operation: "is empty" }], true);
    cy.notVisible('[data-cy*="-cell-"]');

    addFilter([{ column: "id", operation: "is not empty" }], true);

    verifyTableElements([
      { id: 1, name: "Sarah", email: "sarah@example.com" },
      { id: 2, name: "Lisa", email: "lisa@example.com" },
      { id: 3, name: "Sam", email: "sam@example.com" },
      { id: 4, name: "Jon", email: "jon@example.com" },
    ]);
  });

  it("should verify table preview", () => {});
});
