// A ListView's `properties.recordLayouts` is keyed by child component id; ids change when components are copied.
export function remapRecordLayoutIds(properties: any, idMap: Record<string, string>) {
  const memory = properties?.recordLayouts?.value;
  if (!memory || typeof memory !== 'object') return properties;
  const remapped = Object.fromEntries(
    Object.entries(memory).map(([mode, layouts]) => [
      mode,
      layouts && typeof layouts === 'object'
        ? Object.fromEntries(
            Object.entries(layouts as Record<string, unknown>)
              .filter(([childId]) => Object.prototype.hasOwnProperty.call(idMap, childId))
              .map(([childId, layout]) => [idMap[childId], layout])
          )
        : layouts,
    ])
  );
  return { ...properties, recordLayouts: { ...properties.recordLayouts, value: remapped } };
}
