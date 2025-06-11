import { Definition } from '../dto';
export enum THEME_UPDATE_TYPE {
  NAME = 'name',
  DEFINITION = 'definition',
  DEFAULT = 'default',
}

export const defaultThemeName = 'TJ default';

export const TJDefaultTheme: Definition = {
  brand: {
    colors: {
      primary: {
        light: '#4368E3',
        dark: '#4A6DD9',
      },
      secondary: {
        light: '#6A727C',
        dark: '#CFD3D8',
      },
      tertiary: {
        light: '#1E823B',
        dark: '#318344',
      },
    },
  },
  text: {
    font: 'IBM Plex Sans',
    colors: {
      primary: {
        light: '#1B1F24',
        dark: '#CFD3D8',
      },
      placeholder: {
        light: '#6A727C',
        dark: '#858C94',
      },
      disabled: {
        light: '#ACB2B9',
        dark: '#545B64',
      },
    },
  },
  border: {
    radius: {
      default: 6,
      small: 0,
      large: 0,
    },
    colors: {
      default: {
        light: '#CCD1D5',
        dark: '#3C434B',
      },
      weak: {
        light: '#E4E7EB',
        dark: '#EEF0F1',
      },
      disabled: {
        light: '#E4E7EB',
        dark: '#F6F8FA',
      },
    },
  },
  systemStatus: {
    colors: {
      success: {
        light: '#1E823B',
        dark: '#318344',
      },
      error: {
        light: '#D72D39',
        dark: '#D03F43',
      },
      warning: {
        light: '#BF4F03',
        dark: '#BA5722',
      },
    },
  },
  surface: {
    colors: {
      appBackground: {
        light: '#F6F6F6',
        dark: '#121518',
      },
      surface1: {
        light: '#FFFFFF',
        dark: '#1E2226',
      },
      surface2: {
        light: '#F6F8FA',
        dark: '#2B3036',
      },
      surface3: {
        light: '#E4E7EB',
        dark: '#3C434B',
      },
    },
  },
};

export enum FEATURE_KEY {
  THEMES_GET_ALL = 'themes_get_all', // Corresponds to findAll (GET '/themes')
  THEMES_CREATE = 'themes_create', // Corresponds to createTheme (POST '/themes')
  THEMES_UPDATE_DEFAULT = 'themes_update_default', // Corresponds to updateThemeDefault (PATCH '/themes/:id/default')
  THEMES_UPDATE_DEFINITION = 'themes_update_definition', // Corresponds to updateThemeDefinition (PATCH '/themes/:id/definition')
  THEMES_UPDATE_NAME = 'themes_update_name', // Corresponds to updateThemeName (PATCH '/themes/:id/name')
  THEMES_DELETE = 'themes_delete', // Corresponds to deleteTheme (DELETE '/themes/:id')
}
