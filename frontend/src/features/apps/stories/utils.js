/**
 * Generates an array of mock app objects for Storybook.
 * @param {number} count - The number of mock apps to generate.
 * @returns {Array<Object>} An array of mock app objects.
 */
export function generateMockApps(count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: `app-${i + 1}`,
    name: `Test Application ${i + 1}`,
    lastEdited: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 14).toISOString(),
    editedBy: ['Admin', 'John Doe', 'Jane Smith'][Math.floor(Math.random() * 3)],
    _originalApp: {
      id: `app-orig-${i + 1}`,
      name: `Test Application ${i + 1}`,
      slug: `test-application-${i + 1}`,
    },
  }));
}

/**
 * Generates an array of mock folder objects for Storybook.
 * @param {number} count - The number of mock folders to generate.
 * @returns {Array<Object>} An array of mock folder objects.
 */
export function generateMockFolders(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: `folder-${i + 1}`,
    name: `Folder ${i + 1}`,
    count: Math.floor(Math.random() * 20),
  }));
}
