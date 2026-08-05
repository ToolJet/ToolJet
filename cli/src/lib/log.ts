// Only the "Error" label gets a red background — colorizing the whole message
// would paint every line of a multi-line message red until the reset code.
export function formatError(message: string): string {
  return `\x1b[41mError\x1b[0m : ${message}`;
}
