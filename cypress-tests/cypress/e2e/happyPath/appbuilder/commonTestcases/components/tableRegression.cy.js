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
  addNewRow,
} from "Support/utils/table";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
  selectSupportCSAData,
} from "Support/utils/events";
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
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { textInputText } from "Texts/textInput";
import { deleteDownloadsFolder } from "Support/utils/common";
import { resizeQueryPanel } from "Support/utils/dataSource";
import { waitForQueryAction } from "Support/utils/queries";

describe("Table", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-App`);
    cy.openApp();
    deleteDownloadsFolder();
    cy.viewport(1400, 2200);
    cy.modifyCanvasSize(900, 800);
    cy.dragAndDropWidget("Table", 50, 50);
    cy.resizeWidget(tableText.defaultWidgetName, 750, 600);
    resizeQueryPanel("1");
    cy.get(`[data-cy="allow-selection-toggle-button"]`).click({ force: true });
  });
  afterEach(() => {
    cy.apiDeleteApp();
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
    cy.get(`${tableSelector.pageIndexDetails}>input`)
      .invoke("val")
      .should("equal", "1");
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
    cy.get(".canvas-container").click();
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
    editAndVerifyWidgetName(data.widgetName, []);
    cy.forceClickOnCanvas();

    openEditorSidebar(data.widgetName);
    cy.get('[data-cy="table-data-input-field"]').clearAndTypeOnCodeMirror(
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
    //cy.get('[data-cy="inspector-close-icon"]').click();
    openEditorSidebar(data.widgetName);
    openAccordion("Columns", []);
    deleteAndVerifyColumn("email");
    openEditorSidebar(data.widgetName);
    openAccordion("Action buttons");
    cy.get('[data-cy="no-items-banner-action-button"]').should(
      "have.text",
      "No action buttons"
    );
    cy.get('[data-cy="button-add-new-action-button"]')
      .should("have.text", "New action button")
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
      "Button text"
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
      "Button position"
    ); // dropdown_type
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    openEditorSidebar(data.widgetName);
    cy.get('[data-cy="pages-name-fakename1"]').click();

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
    cy.waitForAutoSave();
    openEditorSidebar(data.widgetName);
    cy.get('[data-cy="pages-name-fakename1"]').click();
    cy.get('[data-cy="leftActions-cell-0"]').eq(0).find("button").click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents, []);
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
    openAccordion('Layout', []);

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
    editAndVerifyWidgetName(data.widgetName, []);

    openEditorSidebar(data.widgetName);
    cy.wait(500);
    addAndOpenColumnOption("Fake-Link", `link`);
    verifyAndEnterColumnOptionInput("key", "name");
    cy.get('[data-cy="dropdown-link-target"] >>:eq(0)')
      .click()
      .find("input")
      .type(`{selectAll}{backspace}new window{enter}`);

    cy.forceClickOnCanvas();
    cy.get('[data-cy="linksarah-cell-3"]')
      .contains("a", "Sarah")
      .should("have.attr", "target", "_blank");

    openEditorSidebar(data.widgetName);
    cy.get('[data-cy*="column-Fake-Link"]').click();

    cy.get('[data-cy="dropdown-link-target"] >>:eq(0)')
      .click()
      .find("input")
      .type(`{selectAll}{backspace}same window{enter}`);
    cy.forceClickOnCanvas();
    cy.get('[data-cy="linksarah-cell-3"]')
      .contains("a", "Sarah")
      .should("have.attr", "target", "_self");

    //String/default
    openEditorSidebar(data.widgetName);
    cy.wait(500);
    deleteAndVerifyColumn("id");
    deleteAndVerifyColumn("name");
    deleteAndVerifyColumn("email");
    deleteAndVerifyColumn("fake-link");
    cy.wait(500);
    addAndOpenColumnOption("Fake-String", `string`);
    selectDropdownOption('[data-cy="input-overflow"] >>:eq(0)', `wrap`);
    cy.get('[data-index="0"]>.select-search-option:eq(1)').realClick();
    verifyAndEnterColumnOptionInput("key", "name");
    verifyAndEnterColumnOptionInput("Text color", "red");
    verifyAndEnterColumnOptionInput("Cell background color", "yellow");
    cy.get(
      '[data-cy="input-and-label-cell-background-color"] > .form-label'
    ).click();
    cy.wait(500);

    cy.get(tableSelector.column(0))
      .eq(0)
      .should("have.css", "background-color", "rgb(255, 255, 0)", {
        timeout: 10000,
      });
    cy.get(tableSelector.column(0))
      .eq(0)
      .find(".align-items-center")
      .last()
      .should("have.text", "Sarah")
      .and("have.css", "color", "rgb(255, 0, 0)");

    cy.get('[data-cy="make-editable-toggle-button"]').click();
    cy.get('[data-cy="header-validation"]').verifyVisibleElement(
      "have.text",
      "Validation"
    );
    verifyAndEnterColumnOptionInput("Regex", "AABb");
    verifyAndEnterColumnOptionInput("Min length", "4");
    verifyAndEnterColumnOptionInput("Max length", "5");
    verifyAndEnterColumnOptionInput("Custom rule", " ");
    verifyInvalidFeedback(0, 0, "The input should match pattern");
    addInputOnTable(0, 0, "AABb");

    // cy.notVisible('[data-cy="stringsarah-cell-0"] >>>.invalid-feedback');
    openEditorSidebar(data.widgetName);
    deleteAndVerifyColumn("fake-string");

    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-number", `number`);
    // cy.intercept("PUT", "/api/apps/**").as("appSave");
    // cy.wait("@appSave");
    // cy.wait(1000);
    verifyAndEnterColumnOptionInput("key", "id");
    // cy.wait("@appSave");

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
    verifyAndEnterColumnOptionInput("key", " ");
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
    cy.wait(500);
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
    cy.get('[data-cy="table-data-input-field"]').clearAndTypeOnCodeMirror(
      codeMirrorInputLabel(`[{id:1,name:"Mike",email:"mike@example.com", tags:['One','Two','Three'] },{id:2,name:"Nina",email:"nina@example.com" },{id:3,name:"Steph",email:"steph@example.com", tags:['One','Two','Three'] },{id:4,name:"Oliver",email:"oliver@example.com" },
        ]`)
    );

    // closeAccordions(["Options"]);
    cy.get('[data-cy="widget-accordion-data"]').click();
    deleteAndVerifyColumn("tags");
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

    verifyAndEnterColumnOptionInput("key", " ");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    //verifyRadio
    deleteAndVerifyColumn("fake-radio");

    // openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-multiselect", `multiselect`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    verifyAndEnterColumnOptionInput("Values", "{{[1,2,3]");
    verifyAndEnterColumnOptionInput("Labels", '{{["One","Two","Three"]');

    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    //verify multiselect
    deleteAndVerifyColumn("fake-multiselect");

    // openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-toggleswitch", `toggleSwitch`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    // verifyAndEnterColumnOptionInput("Active color", "green"); //use color Picker
    // verifyAndEnterColumnOptionInput("Cell Background Color", "fakeString");
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    deleteAndVerifyColumn("fake-toggleswitch");

    openEditorSidebar(data.widgetName);
    addAndOpenColumnOption("fake-datepicker", `datePicker`);

    verifyAndEnterColumnOptionInput("key", "fakeString");
    // verifyAndEnterColumnOptionInput("Date Display format", "fakeString");
    // verifyAndEnterColumnOptionInput("Cell Background Color", "blue");
    cy.get('[data-cy="make-editable-toggle-button"]').click();

    // verifyAndEnterColumnOptionInput("Date Parse Format", "fakeString");

    // verifyAndEnterColumnOptionInput("Parse in timezone", "fakeString");

    // verifyAndEnterColumnOptionInput("Display in timezone", "fakeString");
    deleteAndVerifyColumn("fake-datepicker");

    verifyAndModifyToggleFx(
      tableText.labelDynamicColumn,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get('[data-cy*="-cell-1"]').should("have.class", "has-text");
    cy.get('[data-cy="column-data-input-field"] ').clearAndTypeOnCodeMirror(
      codeMirrorInputLabel(
        `[{name: 'User email', key: 'email'}, {name: 'Full name', key: 'name', isEditable: false}]`
      )
    );
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader("user-email"))
      .scrollIntoView()
      .verifyVisibleElement("have.text", "User email");
    cy.get('[data-cy*="-cell-1"]').should("not.have.class", "has-text");

    openEditorSidebar(data.widgetName);
    cy.get('[data-cy="column-data-input-field"] ').clearAndTypeOnCodeMirror(
      codeMirrorInputLabel(
        `[{name: 'User email', key: 'email'}, {name: 'Full name', key: 'name', isEditable: true}]`
      )
    );
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy*="-cell-1"]')
      .eq(0)
      .find("input")
      .click()
      .type(`{selectAll}{backspace}Mike Jon`);
    cy.forceClickOnCanvas();
    cy.get('[data-cy*="-cell-1"]').should("have.class", "has-text");
    cy.get('[data-cy*="-cell-1"] [type="text"]')
      .eq(0)
      .verifyVisibleElement("have.value", "Mike Jon");
    cy.get('[data-cy="table-button-save-changes"]').should("be.visible");

    openEditorSidebar(data.widgetName);
    cy.get('[data-cy="column-data-input-field"] ').clearAndTypeOnCodeMirror(
      codeMirrorInputLabel(
        `[{name: 'email', key: 'email', cellBackgroundColor: '#000', textColor: '#fff'}, {name: 'Full name', key: 'name', minLength: 5, maxLength: 6, isEditable: true}]`
      )
    );
    cy.forceClickOnCanvas();
    cy.get('[data-cy*="-cell-0"]')
      .eq(0)
      .should("have.css", "background-color", "rgb(0, 0, 0)");
    cy.get('[data-cy*="-cell-0"] > .td-container > .w-100 > .d-flex')
      .eq(0)
      .should("have.css", "color", "rgb(255, 255, 255)");
    verifyInvalidFeedback(1, 1, "Minimum 5 characters is needed");
    verifyInvalidFeedback(1, 0, "Maximum 6 characters is allowed");
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
      "Action button radius",
      commonWidgetText.borderRadiusInput
    );

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({
      force: true,
    });
    openEditorSidebar(tableText.defaultWidgetName);
    openAccordion("Columns");
    deleteAndVerifyColumn("email");
    openEditorSidebar(tableText.defaultWidgetName);
    openAccordion("Action buttons");
    cy.get('[data-cy="button-add-new-action-button"]').click();

    cy.get('[data-cy="rightActions-cell-2"]')
      .eq(0)
      .find("button")
      .should("have.css", "border-radius", "20px");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyParameter(
      "Border radius",
      commonWidgetText.borderRadiusInput
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({
      force: true,
    });

    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, []);

    verifyAndModifyToggleFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
      false,
      "0px 0px 0px 0px ",
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
    cy.get('[data-cy="dropdown-table-type"]').realHover();
    cy.get('[data-cy="table-type-fx-button"] > svg').click();
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

    cy.get('[data-cy="table-type-fx-button"]>svg').click();
    cy.get('[data-cy="dropdown-table-type"]').click();
    selectFromSidebarDropdown('[data-cy="dropdown-table-type"]', "Classic");
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .click()
      .find("table")
      .invoke("attr", "class")
      .and("contain", "classic");

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectFromSidebarDropdown('[data-cy="dropdown-table-type"]', "Striped");
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .click()
      .find("table")
      .invoke("attr", "class")
      .and("contain", "table-striped");

    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    cy.get('[data-cy="label-cell-size"]').verifyVisibleElement(
      "have.text",
      "Cell size"
    );
    cy.get('[data-cy="cell-size-fx-button"] > svg').click();

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

    cy.get('[data-cy="cell-size-fx-button"] >svg').click();
    selectFromSidebarDropdown('[data-cy="dropdown-cell-size"]', "Condensed");
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).click();

    cy.get(tableSelector.column(0))
      .eq(0)
      .invoke("attr", "class")
      .and("contain", "condensed");

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
    verifyAndModifyToggleFx("Enable pagination", "{{true}}", true);
    cy.get('[data-cy="enable-pagination-toggle-button"]').click();
    cy.get(tableSelector.paginationButtonToPrevious).should("be.visible");
    cy.get(tableSelector.paginationButtonToNext).should("be.visible");

    cy.get("[data-state=off]:eq(3)").click();
    cy.get('[data-cy="label-total-records-server-side"]').verifyVisibleElement(
      "have.text",
      "Total records server side"
    );

    // cy.get('[data-cy="enable-pagination-toggle-button"]').click();
    cy.get("[data-state=off]:eq(3)").click();

    cy.get('[data-cy="label-number-of-rows-per-page"]').verifyVisibleElement(
      "have.text",
      "Number of rows per page"
    );

    verifyAndModifyToggleFx("Enable column sorting", "{{true}}", true); //inputfield
    cy.get('[data-cy="enable-column-sorting-toggle-button"]').click();

    verifyAndModifyToggleFx("Show download button", "{{true}}", true);
    cy.notVisible('[data-tooltip-id="tooltip-for-download"]');

    verifyAndModifyToggleFx("Enable filtering", "{{true}}", true);
    cy.notVisible('[data-tooltip-id="tooltip-for-filter-data"]');

    // cy.get('[data-cy="show-filter-button-toggle-button"]').click();
    // verifyAndModifyToggleFx("Server-side filter", "{{false}}", true);
    // verifyAndModifyToggleFx("Show update buttons", "{{true}}", true);

    cy.get(`[data-cy="allow-selection-toggle-button"]`).click({ force: true });
    verifyAndModifyToggleFx("Bulk selection", "{{false}}", true);
    cy.get('[data-cy="checkbox-input"]').should("be.visible");

    verifyAndModifyToggleFx("Highlight selected row", "{{false}}", true);
    verifyAndModifyToggleFx("Hide column selector button", "{{false}}", true);
    cy.notVisible('[data-cy="select-column-icon"]');

    verifyAndModifyToggleFx("Show search", "{{true}}", true);
    cy.notVisible('[data-cy="search-input-field"]');

    // cy.get('[data-cy="show-search-box-toggle-button"]').click();

    // verifyAndModifyToggleFx("Server-side search", " ", true);
    verifyAndModifyToggleFx("Loading state", "{{false}}", true);
  });

  it("should verify download", () => {
    deleteDownloadsFolder();
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
    // cy.get(tableSelector.filterButton).click();
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

  it("should verify table CSA", () => {
    deleteDownloadsFolder();
    cy.get('[data-cy="column-id"]').click();
    cy.get('[data-cy="make-editable-toggle-button"]').click();
    cy.get(`[data-cy="allow-selection-toggle-button"]`).click({ force: true });

    cy.get(
      '[data-cy="number-of-rows-per-page-input-field"]'
    ).clearAndTypeOnCodeMirror("{{2");
    verifyAndModifyToggleFx("Highlight selected row", "{{false}}", true);

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 50);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Set page");
    addSupportCSAData("Page", "{{2");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 100);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Select row");
    addSupportCSAData("Key", "name");
    addSupportCSAData("Value", "Lisa");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 150);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Deselect row");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 200);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Discard Changes");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 250);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Discard newly added rows");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 300);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Download table data");
    selectSupportCSAData("Download as Excel");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 350);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Download table data");
    selectSupportCSAData("Download as CSV");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.dragAndDropWidget("Button", 800, 400);
    selectEvent("On click", "Control Component");
    selectCSA("table1", "Download table data");
    selectSupportCSAData("Download as PDF");

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.get('[role="row"]').eq(2).should("have.class", "selected");

    cy.get(commonWidgetSelector.draggableWidget("button3")).click();
    cy.get('[role="row"]').eq(2).should("not.have.class", "selected");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get('[data-cy*="-cell-1"] ').eq(1).should("have.text", "Jon");
    cy.get('[data-cy="page-index-details"]').should("have.text", "of 2");
    cy.get(`${tableSelector.pageIndexDetails}>input`)
      .invoke("val")
      .should("equal", "2");

    cy.get('[data-cy="3-cell-0"]')
      .click()
      .find("input")
      .clear()
      .type("test123");

    cy.get('[data-cy*="-cell-0"]')
      .eq(0)
      .find("input")
      .should("have.value", "test123");
    cy.get(commonWidgetSelector.draggableWidget("button4")).click();
    cy.get('[data-cy*="-cell-0"]').eq(0).should("have.text", "3");

    addNewRow();
    cy.get(commonWidgetSelector.draggableWidget("button5")).click();
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("components", "Object", "9 entries ");
    openNode("components");
    verifyNodeData(tableText.defaultWidgetName, "Object", "27 entries ");
    openNode(tableText.defaultWidgetName);
    verifyNodeData("newRows", "Array", "0 item ");

    cy.get('[data-cy="real-canvas"]').click("topRight");
    cy.get(commonWidgetSelector.draggableWidget("button6")).click();
    cy.wait(500);
    cy.task("readXlsx", "cypress/downloads/all-data.xlsx")
      .should("contain", dataCsvAssertionHelper(tableText.defaultInput)[0])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[1])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[2]);

    cy.get(commonWidgetSelector.draggableWidget("button7")).click();
    cy.wait(500);
    cy.readFile("cypress/downloads/all-data.csv", "utf-8")
      .should("contain", dataCsvAssertionHelper(tableText.defaultInput)[0])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[1])
      .and("contain", dataCsvAssertionHelper(tableText.defaultInput)[2]);

    cy.get(commonWidgetSelector.draggableWidget("button8")).click();
    cy.wait(500);
    cy.task("readPdf", "cypress/downloads/all-data.pdf")
      .should("contain", dataPdfAssertionHelper(tableText.defaultInput)[0])
      .and("contain", dataPdfAssertionHelper(tableText.defaultInput)[1])
      .and("contain", dataPdfAssertionHelper(tableText.defaultInput)[2]);
  });

  it("should verify add new row", () => {
    addNewRow();
    cy.contains("Save").click();
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("components", "Object", "1 entry ");
    openNode("components");
    verifyNodeData(tableText.defaultWidgetName, "Object", "26 entries ");
    cy.wait(1000);
    openNode(tableText.defaultWidgetName, 0, 1);
    // openNode(tableText.defaultWidgetName, 0, 1);
    verifyNodeData("newRows", "Array", "1 item ");
    openNode("newRows");
    verifyNodeData("0", "Object", "3 entries ");
    openNode("0");
    verifyValue("id", "String", `"5"`, "1");
    verifyValue("name", "String", `"Nick"`);
    verifyValue("email", "String", `"nick@example.com"`);
  });

  it("should verify Disable action button", () => {
    cy.get('[data-cy="button-add-new-action-button"]')
      .should("have.text", "New action button")
      .click();

    cy.get('[data-cy="action-button-button-0"]').verifyVisibleElement(
      "have.text",
      "Button"
    );
    deleteAndVerifyColumn("name");
    deleteAndVerifyColumn("email");

    cy.get(tableSelector.columnHeader("actions"))
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Actions");
    cy.get(`${tableSelector.column(1)} > > > button`)
      .eq("0")
      .should("have.text", "Button")
      .and("not.have.attr", "disabled");

    cy.get('[data-cy="action-button-button-0"]').click();
    cy.get('[data-cy="label-disable-action-button"]').should("be.visible");
    cy.get('[data-cy="add-event-handler"]').eq(1).click();
    cy.get('[data-cy="event-handler-card"]').click();
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader("actions")).verifyVisibleElement(
      "have.text",
      "Actions"
    );
    cy.get(`${tableSelector.column(1)} > > > button`)
      .eq("0")
      .click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    cy.get('[data-cy="action-button-button-0"]').click();
    cy.get(tableSelector.fxButton(tableText.lableDisableActionButton)).should(
      "be.visible"
    );
    verifyAndModifyToggleFx(
      tableText.lableDisableActionButton,
      "{{false}}",
      true
    );
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader("actions"))
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Actions");
    cy.get(`${tableSelector.column(1)} > > > button`)
      .eq("0")
      .should("have.text", "Button")
      .and("have.attr", "disabled");

    cy.dragAndDropWidget("Toggle Switch", 800, 300);
    openEditorSidebar(tableText.defaultWidgetName);
    cy.get('[data-cy="action-button-button-0"]').click();
    cy.get(tableSelector.fxButton(tableText.lableDisableActionButton))
      .should("be.visible")
      .eq(0)
      .click();
    cy.get(
      commonWidgetSelector.parameterInputField(
        tableText.lableDisableActionButton
      )
    )
      .click()
      .clearAndTypeOnCodeMirror(`{{components.toggleswitch1.value`);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader("actions"))
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Actions");
    cy.get(`${tableSelector.column(1)} > > > button`)
      .eq("0")
      .click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    cy.get(
      '[data-cy="draggable-widget-toggleswitch1"] [type="checkbox"]'
    ).click();
    cy.get(tableSelector.columnHeader("actions"))
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Actions");
    cy.get(`${tableSelector.column(1)} > > > button`)
      .eq("0")
      .should("have.text", "Button")
      .and("have.attr", "disabled");
  });

  it("should verify Programatically actions on table column", () => {
    deleteAndVerifyColumn("id");
    cy.get('[data-cy="inspector-close-icon"]').click();
    cy.dragAndDropWidget("Text", 800, 200);
    openEditorSidebar(commonWidgetText.text1);
    cy.get(
      '[data-cy="textcomponenttextinput-input-field"]'
    ).clearAndTypeOnCodeMirror("Column Email");
    // verifyAndModifyParameter("Text", "Column Email");
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.get(`[data-cy="draggable-widget-${commonWidgetText.text1}"]`).should(
      "have.text",
      "Column Email"
    );
    openEditorSidebar(tableText.defaultWidgetName);
    cy.get('[data-cy="pages-name-email"]').should("be.visible").click();
    cy.get(`[data-cy="input-and-label-column-name"]`)
      .find("label")
      .should("have.text", "Column name");
    cy.get(`[data-cy="input-and-label-column-name"]`)
      .find(".codehinter-default-input")
      .click()
      .clearAndTypeOnCodeMirror(`{{components.text1.text`);
    cy.forceClickOnCanvas();
    openEditorSidebar(tableText.defaultWidgetName);
    cy.get('[data-cy="pages-name-column email"]')
      .scrollIntoView()
      .should("be.visible");
    cy.get(tableSelector.columnHeader("column-email"))
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Column Email");
    cy.get('[data-cy="inspector-close-icon"]').click();

    cy.dragAndDropWidget("Toggle Switch", 800, 300);
    openEditorSidebar(tableText.defaultWidgetName);
    cy.get('[data-cy="column-Column Email"]').should("be.visible").click();
    verifyAndModifyToggleFx(tableText.makeEditable, "{{false}}", 0);
    cy.get(tableSelector.toggleButton(tableText.makeEditable)).click();
    cy.get(tableSelector.fxButton(tableText.makeEditable))
      .should("be.visible")
      .eq(0)
      .click();
    cy.get(commonWidgetSelector.parameterInputField(tableText.makeEditable))
      .click()
      .clearAndTypeOnCodeMirror(`{{components.toggleswitch1.value`);
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy*="-cell-1"]').eq(0).should("not.have.class", "has-text");
    cy.get(
      '[data-cy="draggable-widget-toggleswitch1"] [type="checkbox"]'
    ).click();
    cy.get('[data-cy*="-cell-1"]')
      .eq(0)
      .click()
      .find("input")
      .type(`{selectAll}{backspace}{Enter}`)
      .realType("Jack");
    cy.get('[data-cy*="-cell-1"]').should("have.class", "has-text");
    cy.get('[data-cy*="-cell-1"] [type="text"]')
      .eq(0)
      .verifyVisibleElement("have.value", "Jack");
  });

  it("should verify server-side paginaion", () => {
    let dsName = fake.companyName;
    cy.apiCreateGDS(
      "http://localhost:3000/api/v2/data_sources",
      `cypress-${dsName}-postgresql`,
      "postgresql",
      [
        { key: "host", value: Cypress.env("pg_host") },
        { key: "port", value: 5432 },
        { key: "database", value: Cypress.env("pg_user") },
        { key: "username", value: Cypress.env("pg_user") },
        { key: "password", value: Cypress.env("pg_password"), encrypted: true },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );
    cy.apiAddQueryToApp(
      "q112",
      {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT *
        FROM server_side_pagination
        ORDER BY id
        LIMIT 10 OFFSET {{(components.table1.pageIndex-1)*10}};`,
      },
      `cypress-${dsName}-postgresql`,
      "postgresql"
    );
    cy.reload();
    openEditorSidebar(tableText.defaultWidgetName);
    cy.get("[data-state=off]:eq(3)").click();
    cy.get(
      '[data-cy="total-records-server-side-input-field"]'
    ).clearAndTypeOnCodeMirror("50");

    selectEvent("Page changed", "Run Query", 1);
    cy.get('[data-cy="query-selection-field"]')
      .click()
      .find("input")
      .type(`{selectAll}{backspace}q112{enter}`);
    cy.get('[data-cy="table-data-input-field"]').clearAndTypeOnCodeMirror(
      `{{queries.q112.data`
    );
    cy.get('[data-cy="pagination-button-to-next"]').click();
    waitForQueryAction("run");
    cy.get('[data-cy="11-cell-0"]').verifyVisibleElement("have.text", "11");
    cy.get('[data-cy="pagination-button-to-previous"]').click();
    waitForQueryAction("run");
    cy.get('[data-cy="1-cell-0"]').verifyVisibleElement("have.text", "1");

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);
    cy.get('[data-cy="pagination-button-to-next"]').click();
    cy.get('[data-cy="11-cell-0"]', { timeout: 10000 }).verifyVisibleElement(
      "have.text",
      "11"
    );
    cy.get('[data-cy="pagination-button-to-previous"]').click();
    cy.get('[data-cy="1-cell-0"]', { timeout: 10000 }).verifyVisibleElement(
      "have.text",
      "1"
    );
  });
});
