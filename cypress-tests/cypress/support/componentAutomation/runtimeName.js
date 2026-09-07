function deriveCandidate(componentName) {
  return componentName.toLowerCase().replace(/[^a-z0-9]/g, "") + "1";
}

function resolveRuntimeName(componentName, cache) {
  const cached = cache?.components?.[componentName]?.runtimeName;
  if (cached) return { name: cached, source: "cache" };
  return { name: deriveCandidate(componentName), source: "candidate" };
}

module.exports = { deriveCandidate, resolveRuntimeName };
