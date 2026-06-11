import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const useThemeAccess = () => {
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  return licenseValid && featureAccess?.customThemes;
};

export default useThemeAccess;
