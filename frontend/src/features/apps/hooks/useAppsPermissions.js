// Minimal permissions hook; replace with real policy integration later.
export function useAppsPermissions() {
  return {
    canImport: true,
    canEdit: true,
    canPlay: true,
  };
}

export default useAppsPermissions;


