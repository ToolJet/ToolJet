# Chat Widget Dark Theme Examples

This directory contains example implementations for enabling dark theme on popular chat widgets.

## 📁 Files

- **`CHAT_WIDGET_DARK_THEME_FIX.md`** - Comprehensive guide with solutions for all major chat services
- **`universal-dark-theme.js`** - Universal script that auto-detects and applies dark theme to any chat widget
- **`intercom-dark-theme.html`** - Complete example for Intercom
- **`crisp-dark-theme.html`** - Complete example for Crisp
- **`zendesk-dark-theme.html`** - Complete example for Zendesk

## 🚀 Quick Start

### Option 1: Universal Script (Recommended)

Add this script to your website to automatically apply dark theme to any supported chat widget:

```html
<script src="./universal-dark-theme.js"></script>
```

Or include it inline:

```html
<script>
  // Paste contents of universal-dark-theme.js here
</script>
```

The script will:
- ✅ Auto-detect your page's theme (dark/light)
- ✅ Apply dark theme to any supported chat widget
- ✅ Watch for theme changes and update automatically
- ✅ Support Intercom, Crisp, Zendesk, Tawk.to, Drift, and Userlike

### Option 2: Service-Specific Implementation

1. Open the HTML file for your chat service (e.g., `intercom-dark-theme.html`)
2. Copy the relevant script section
3. Replace placeholder IDs with your actual credentials
4. Add to your website's HTML

## 🎨 Customizing Colors

All examples use ToolJet's brand colors:

```javascript
const THEME_CONFIG = {
  backgroundColor: '#1F2937',    // Dark gray
  primaryColor: '#4F46E5',       // Indigo/Purple
  textColor: '#F9FAFB',          // Light text
  secondaryColor: '#374151',     // Medium gray
  accentColor: '#818CF8'         // Light indigo
};
```

To customize, simply change these values in the configuration.

## 📋 Supported Chat Services

| Service | Status | File |
|---------|--------|------|
| Intercom | ✅ Supported | `intercom-dark-theme.html` |
| Crisp | ✅ Supported | `crisp-dark-theme.html` |
| Zendesk | ✅ Supported | `zendesk-dark-theme.html` |
| Tawk.to | ✅ Supported | `universal-dark-theme.js` |
| Drift | ✅ Supported | `universal-dark-theme.js` |
| Userlike | ✅ Supported | `universal-dark-theme.js` |

## 🔍 How to Identify Your Chat Service

1. Open your website in a browser
2. Press `F12` to open Developer Tools
3. Go to the **Network** tab
4. Look for requests to:
   - `intercom.io` → You're using Intercom
   - `crisp.chat` → You're using Crisp
   - `zdassets.com` or `zendesk.com` → You're using Zendesk
   - `tawk.to` → You're using Tawk.to
   - `drift.com` → You're using Drift
   - `userlike.com` → You're using Userlike

## 💻 Implementation Steps

### For Webflow Sites

1. Go to **Site Settings** → **Custom Code**
2. Paste the script in the **Footer Code** section
3. Replace placeholder IDs with your actual credentials
4. Publish your site

### For WordPress Sites

1. Go to **Appearance** → **Theme Editor**
2. Edit `footer.php` or use a custom scripts plugin
3. Add the script before `</body>` tag
4. Save and clear cache

### For Static HTML Sites

1. Open your main HTML file or template
2. Add the script before the closing `</body>` tag
3. Replace placeholder IDs with your actual credentials
4. Deploy your site

### For React/Next.js Apps

```javascript
// Add to _app.js or layout component
useEffect(() => {
  // Paste universal-dark-theme.js content here
  // Or import it as a separate file
}, []);
```

## 🧪 Testing

After implementation:

1. ✅ Clear browser cache
2. ✅ Visit your website
3. ✅ Open the chat widget
4. ✅ Verify dark theme is applied
5. ✅ Test on mobile devices
6. ✅ Check browser console for errors

## 🐛 Troubleshooting

### Widget doesn't appear dark

- Check browser console for JavaScript errors
- Verify your chat service ID/key is correct
- Try clearing cache and hard refresh (Ctrl+Shift+R)
- Ensure the script loads after the chat widget script

### Widget appears dark then switches back

- The chat service might be overriding your theme
- Add `!important` flags in CSS if available
- Increase the delay in setTimeout calls

### Multiple widgets on the page

The universal script supports multiple widgets simultaneously. They will all be themed consistently.

## 📚 Additional Resources

- [Intercom Customization Docs](https://developers.intercom.com/installing-intercom/docs/customize-intercom-messenger)
- [Crisp SDK Docs](https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/dollar-crisp/)
- [Zendesk Widget API](https://developer.zendesk.com/api-reference/widget/introduction/)
- [Tawk.to API](https://developer.tawk.to/)
- [Drift API](https://devdocs.drift.com/)

## 🤝 Contributing

Found a bug or want to add support for another chat service? Please submit a PR or open an issue!

## 📝 License

These examples are provided as-is for use with the ToolJet project.
