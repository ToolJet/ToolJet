import { commonWidgetSelector } from "Selectors/common";
import { tableText } from "Texts/table";
import { tableSelector } from "Selectors/table";
import { searchOnTable } from "Support/utils/table";

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

    cy.get(tableSelector.buttonAddFilter).dblclick();

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
});
