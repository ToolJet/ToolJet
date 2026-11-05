declare module 'config' {
  const config: Record<string, string> & { apiUrl: string };
  export default config;
}

// Runtime config the server injects into the page; every value is a string.
interface Window {
  public_config?: Record<string, string | undefined>;
}
