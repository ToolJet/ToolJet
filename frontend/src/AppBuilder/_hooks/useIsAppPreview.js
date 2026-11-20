import { useLocation } from 'react-router-dom';
import useStore from '@/AppBuilder/_stores/store';

// The viewer is showing Preview: the URL names an environment or a version, and the user is signed in (not public).
export const useIsAppPreview = () => {
  const { search } = useLocation();
  const isPublicAccess = useStore((state) => state.isPublicAccess);
  const searchParams = new URLSearchParams(search);
  return (searchParams.has('env') || searchParams.has('version')) && !isPublicAccess;
};
