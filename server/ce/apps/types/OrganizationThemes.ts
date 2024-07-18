export interface OrganizationThemes {
  id: string;
  name: string;
  definition: Definition;
  isDefault: boolean;
  isBasic: boolean;
  isDisabled: boolean;
}

interface Colors {
  primary: {
    light: string;
    dark: string;
  };
  secondary?: {
    light: string;
    dark: string;
  };
  tertiary?: {
    light: string;
    dark: string;
  };
}

interface Definition {
  brand: { colors: Colors };
}

export class TJDefaultTheme {
  primary = {
    light: '#4368E3',
    dark: '#4A6DD9',
  };
  secondary = {
    light: '#6A727C',
    dark: '#CFD3D8',
  };
  tertiary = {
    light: '#1E823B',
    dark: '#318344',
  };
}
