import { commonSelectors } from "Selectors/common";
import { databaseSelectors } from "Selectors/database";
import { databaseText } from "Texts/database";
import {
  closeModal,
  navigateToDatabase,
  selectAppCardOption,
} from "Support/utils/common";
import { verifyAllElementsOfPage } from "Support/utils/database";
import { commonText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { buttonText } from "Texts/button";

describe("Database Functionality", () => {
  beforeEach(() => {
    cy.appUILogin();
  });
  it("Verify that all elements of the table page", () => {
    navigateToDatabase();
    verifyAllElementsOfPage();
  });
});
