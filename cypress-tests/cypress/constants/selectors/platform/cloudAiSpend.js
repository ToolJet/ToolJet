export const aiSpendSelectors = {
  navItem: '[data-cy="ai-credits-usage-list-item"]',
  limitSwitch: '[role="switch"]',
  card: (name) => `section[aria-label="${name}"]`,
  editBuilderLimit: (name) => `button[aria-label^="Edit limit for ${name}"]`,
  searchInput: 'input[aria-label="Search builders"]',
  builderTypeButton: 'button[aria-label="Builder type"]',
  sortButton: 'button[aria-label="Sort"]',
  tableRows: "tbody tr",
  dialog: '[role="dialog"]',
  dialogInput: '[role="dialog"] input',
};
