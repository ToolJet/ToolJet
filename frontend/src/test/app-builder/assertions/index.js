export function expectNoConsoleErrors(spy) {
  expect(spy).not.toHaveBeenCalled();
}
