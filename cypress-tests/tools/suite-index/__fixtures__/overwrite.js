Cypress.Commands.overwrite("alpha", (originalFn, a) => {
  return originalFn(a);
});
