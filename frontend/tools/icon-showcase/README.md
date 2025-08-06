# ToolJet Icon Showcase

A development tool to browse and explore all icons in the ToolJet codebase.

## Features

- 🔍 **Search**: Find icons by component name
- 🏷️ **Filter**: Show bulk icons, solid icons, or all
- 📐 **Grid Size**: Adjustable grid layout (Small/Medium/Large)
- 📋 **Copy**: Copy JSX usage or component name to clipboard
- ⚡ **Hot Reload**: Automatically detects new icons
- 📱 **Responsive**: Works on desktop and mobile

## Usage

From the frontend directory:

```bash
npm run icons
```

This will:
- Start the development server on http://localhost:3001
- Automatically open the icon showcase in your browser
- Dynamically load all icons from both `src/_ui/Icon/bulkIcons/` and `src/_ui/Icon/solidIcons/`

## Adding New Icons

1. Add your new icon component to either:
   - `src/_ui/Icon/bulkIcons/YourIcon.jsx` 
   - `src/_ui/Icon/solidIcons/YourIcon.jsx`

2. Refresh the icon showcase (or it may hot-reload automatically)

3. Your new icon will appear in the showcase

## File Structure

```
tools/icon-showcase/
├── README.md              # This file
├── App.js                 # Main app component
├── IconShowcase.jsx       # Core showcase component
├── IconShowcase.scss      # Styles
├── index.html            # HTML template
├── index.js              # Entry point
└── webpack.config.js     # Webpack configuration
```

## Technical Notes

- Icons are loaded dynamically using `require.context()`
- Each icon renders with its default props/styling
- The tool is isolated and doesn't affect main ToolJet development
- Runs on a separate webpack dev server (port 3001)
- All icons are loaded with error handling to prevent crashes

## Troubleshooting

If icons aren't displaying:
1. Ensure icon components export a default React component
2. Check the browser console for loading errors
3. Verify the icon file is a valid `.jsx` file in the correct directory