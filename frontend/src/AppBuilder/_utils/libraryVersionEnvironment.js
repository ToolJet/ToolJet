export function isLibraryVersionInEnvironment({
  isDraft = false,
  versionEnvironment,
  targetEnvironment,
  environments = [],
}) {
  if (!targetEnvironment) return true;
  const priority = (environment) =>
    environments.find((entry) => entry.id === environment?.id)?.priority ?? environment?.priority;
  const targetPriority = priority(targetEnvironment);
  if (targetPriority === 1) return true;
  return !isDraft && targetPriority > 1 && priority(versionEnvironment) >= targetPriority;
}
