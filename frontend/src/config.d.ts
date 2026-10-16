declare module 'config' {
  const config: Record<string, string> & { apiUrl: string };
  export default config;
}
