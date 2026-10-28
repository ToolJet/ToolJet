// What a component shows when it is dropped on the canvas, as UI 2.0's widgets and the shadcn pack do: small,
// coherent samples whose keys match the component's own default fields, so it renders filled right away.

const opts = (...labels: string[]) => labels.map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, '-') }));

export const SAMPLE = {
  status: opts('Active', 'Pending', 'Archived'),
  cities: opts('Lisbon', 'Berlin', 'Toronto', 'Singapore', 'Sydney'),
  plans: opts('Free', 'Pro', 'Enterprise'),
  periods: opts('Day', 'Week', 'Month'),
  // The cartesian charts (bar, line, area): a month with two numeric series.
  monthly: [
    { month: 'Jan', revenue: 4200, expenses: 2800 },
    { month: 'Feb', revenue: 4800, expenses: 3100 },
    { month: 'Mar', revenue: 5300, expenses: 3000 },
    { month: 'Apr', revenue: 5100, expenses: 3400 },
    { month: 'May', revenue: 6200, expenses: 3600 },
    { month: 'Jun', revenue: 6800, expenses: 3900 },
  ],
  xAxis: [{ dataKey: 'month', label: 'Month' }],
  series: [
    { dataKey: 'revenue', label: 'Revenue' },
    { dataKey: 'expenses', label: 'Expenses' },
  ],
  pie: [
    { id: 'web', label: 'Web', value: 48 },
    { id: 'mobile', label: 'Mobile', value: 32 },
    { id: 'retail', label: 'Retail', value: 20 },
  ],
  // DataGrid: products, with MUI's column shape and the pack's formats.
  rows: [
    { id: 1, product: 'Desk lamp', category: 'Lighting', price: 39.9, stock: 120, status: 'In stock' },
    { id: 2, product: 'Office chair', category: 'Furniture', price: 189, stock: 14, status: 'Low stock' },
    { id: 3, product: 'Standing desk', category: 'Furniture', price: 420, stock: 0, status: 'Out of stock' },
    { id: 4, product: 'Monitor arm', category: 'Accessories', price: 79.5, stock: 56, status: 'In stock' },
    { id: 5, product: 'Cable tray', category: 'Accessories', price: 24, stock: 210, status: 'In stock' },
  ],
  columns: [
    { field: 'product', headerName: 'Product', flex: 1.4 },
    { field: 'category', headerName: 'Category' },
    { field: 'price', headerName: 'Price', format: 'currency' },
    { field: 'stock', headerName: 'Stock' },
    { field: 'status', headerName: 'Status', format: 'chip', colors: { 'In stock': 'success', 'Low stock': 'warning', 'Out of stock': 'error' } },
  ],
  // List: its default fields are title and description.
  items: [
    { id: 1, title: 'Quarterly report', description: 'Due Friday' },
    { id: 2, title: 'Design review', description: 'Tuesday, 10:00' },
    { id: 3, title: 'Team offsite', description: 'Next month' },
  ],
  // Kanban: cards by status, with the fields a fresh board maps (description, priority badge, owner avatar).
  kanban: [
    { id: 1, title: 'Draft the brief', description: 'Goals, audience and timeline', status: 'todo', priority: 'High', owner: 'Ada Lovelace' },
    { id: 2, title: 'Collect references', description: 'Three competitor sites', status: 'todo', priority: 'Low', owner: 'Alan Turing' },
    { id: 3, title: 'Review designs', description: 'Home and pricing pages', status: 'doing', priority: 'Medium', owner: 'Grace Hopper' },
    { id: 4, title: 'Ship v1', description: 'Release notes and announcement', status: 'done', priority: 'Normal', owner: 'Katherine Johnson' },
  ],
  kanbanColumns: [
    { id: 'todo', title: 'To do' },
    { id: 'doing', title: 'In progress' },
    { id: 'done', title: 'Done' },
  ],
};
