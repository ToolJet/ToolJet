/**
 * The base64 SVG of a marketplace plugin's icon for the theme in use: its dark icon
 * (`lib/darkIcon.svg`) in dark mode when it ships one, otherwise its icon.
 *
 * `plugin` is a plugin as the API returns it, or the `plugin` of a data source or data
 * query, which arrives with snake_case keys. Anything else has no icon file.
 */
export const pluginIconFile = (plugin, darkMode = localStorage.getItem('darkMode') === 'true') => {
  const icon = plugin?.iconFile?.data ?? plugin?.icon_file?.data;
  const darkIcon = plugin?.darkIconFile?.data ?? plugin?.dark_icon_file?.data;
  return (darkMode && darkIcon) || icon;
};
