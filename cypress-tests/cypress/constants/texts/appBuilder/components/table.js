export const tableText = {
  defaultWidgetName: "table1",
  tableDocumentationLink: "Table documentation",
  // NewTable default sample dataset (verified at runtime, DIAG dump). The widget now
  // ships a 10-row demo dataset with columns id/photo/name/email/date/interest/phone.
  // (Legacy 4-row Sarah/Lisa/Sam/Jon data is GONE.)
  defaultInput: [
    { id: 1, name: "Olivia Nguyen", email: "olivia.nguyen@example.com" },
    { id: 2, name: "Liam Patel", email: "liam.patel@example.com" },
    { id: 3, name: "Sophia Reyes", email: "sophia.reyes@example.com" },
    { id: 4, name: "Jacob Hernandez", email: "jacob.hernandez@example.com" },
    { id: 5, name: "William Sanchez", email: "william.sanchez@example.com" },
    { id: 6, name: "Ethan Morales", email: "ethan.morales@example.com" },
    { id: 7, name: "Mia Tiana", email: "mia.tiana@example.com" },
    { id: 8, name: "Lucas Ramirez", email: "lucas.ramirez@example.com" },
    { id: 9, name: "Alexander Vela", email: "alexander.vela@example.com" },
    { id: 10, name: "Michael Reyes", email: "michael.reyes@example.com" },
  ],

  // Custom dataset some tests load explicitly via the Table data input field.
  customInput: [
    { id: 1, name: "Sarah", email: "sarah@example.com" },
    { id: 2, name: "Lisa", email: "lisa@example.com" },
    { id: 3, name: "Sam", email: "sam@example.com" },
    { id: 4, name: "Jon", email: "jon@example.com" },
  ],

  placeHolderSearch: "Search",
  defaultNumberOfRecords: "10 Records",

  optionDownloadCSV: "Download as CSV",
  optionDownloadExcel: "Download as Excel",

  oprionSelectAll: "Select All",

  headerFilters: "Filters",
  labelNoFilters: "no filters yet.",
  buttonLabelAddFilter: "+ add filter",
  buttonLabelClearFilters: "clear filters",
  labelColumn: "column",
  labelAnd: "and",
  id: "id",
  email: "email",
  name: "name",
  optionEquals: "equals",

  labelDynamicColumn: "Use dynamic column",
  makeEditable: "Make editable",
  lableDisableActionButton: "Disable action button",
};
