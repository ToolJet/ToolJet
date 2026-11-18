/** Message of a caught value, which may not be an Error. */
export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
