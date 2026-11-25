// List filters take one id or several (a query param given once arrives as a string).
export const toIdList = (value?: string | string[]): string[] => (Array.isArray(value) ? value : value ? [value] : []);
