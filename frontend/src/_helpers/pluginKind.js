export const resolvePluginKind = (source) =>
  `${source?.kind ?? source?.pluginId ?? source?.plugin_id ?? ''}`.toLowerCase();

export const isOpenAIKind = (kind) => `${kind ?? ''}`.toLowerCase() === 'openai';
