export const searchOnTable = (value = "") => {
  cy.get('[data-cy="search-input-field"]').type(
    `{selectAll}{backspace}${value}`
  );
  cy.wait(100);
};
