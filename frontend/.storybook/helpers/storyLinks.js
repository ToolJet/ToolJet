export const toDocsPath = (title) => {
  const path = `/docs/${title.toLowerCase().replace(/[^\w]+/g, '-')}--docs`;
  return path;
};

export const navigateToDocs = (title) => {
  const path = `/docs/${title.toLowerCase().replace(/[^\w]+/g, '-')}--docs`;
  if (typeof window !== 'undefined') {
    window.parent.location.href = `/?path=${path}`;
  }
};

