# Chat Widget Dark Theme Fix

## Issue
The homepage (tooljet.ai) uses a dark theme, but the chat/support widget opens in light theme, creating an inconsistent user experience.

## Solution
Enable dark mode for the chat widget by adding theme configuration to the widget initialization code.

---

## Implementation Guide

### Step 1: Identify the Chat Widget Service

1. Visit [tooljet.ai](https://tooljet.ai) in your browser
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Check the **Network** tab for requests to common chat services:
   - `intercom.io`
   - `crisp.chat`
   - `tawk.to`
   - `zendesk.com`
   - `drift.com`
   - `userlike.com`
4. Or check the **Elements** tab and inspect the chat widget element for identifying class names

---

### Step 2: Apply Dark Theme Configuration

Once you've identified the service, use the appropriate configuration below:

## For Intercom

**Location:** Find the Intercom initialization script (usually in the website's HTML `<head>` or before `</body>`)

**Current Code:**
```javascript
window.intercomSettings = {
  app_id: "YOUR_APP_ID"
};
```

**Fixed Code:**
```javascript
window.intercomSettings = {
  app_id: "YOUR_APP_ID",
  theme: "dark",
  background_color: "#1F2937",  // Dark gray background
  action_color: "#4F46E5"        // Accent color (customize as needed)
};
```

---

## For Crisp

**Location:** Find the Crisp initialization script

**Current Code:**
```javascript
window.$crisp = [];
window.CRISP_WEBSITE_ID = "YOUR_WEBSITE_ID";
```

**Fixed Code:**
```javascript
window.$crisp = [];
window.CRISP_WEBSITE_ID = "YOUR_WEBSITE_ID";

// Add dark theme after initialization
(function() {
  window.$crisp.push(["safe", true]);
  window.$crisp.push(["config", "color:theme", "#1F2937"]);
  window.$crisp.push(["config", "color:button", "#4F46E5"]);
})();
```

---

## For Zendesk

**Location:** Find the Zendesk Widget initialization script

**Current Code:**
```javascript
window.zESettings = {
  webWidget: {
    // existing settings
  }
};
```

**Fixed Code:**
```javascript
window.zESettings = {
  webWidget: {
    color: {
      theme: "#1F2937",           // Dark gray
      launcher: "#4F46E5",        // Launcher button color
      launcherText: "#FFFFFF"     // Text color
    },
    launcher: {
      chatLabel: {
        "en-US": "Need Help?"
      }
    }
  }
};
```

---

## For Tawk.to

**Location:** Find the Tawk.to initialization script

**Add this after the Tawk.to script loads:**
```javascript
var Tawk_API = Tawk_API || {};

Tawk_API.onLoad = function(){
  // Set dark theme
  Tawk_API.setAttributes({
    'theme': 'dark'
  }, function(error){});
  
  // Customize colors
  Tawk_API.customStyle = {
    visibility : {
      desktop : {
        position : 'br',
        xOffset : 20,
        yOffset : 20
      },
      mobile : {
        position : 'br',
        xOffset : 10,
        yOffset : 10
      }
    }
  };
};
```

---

## For Drift

**Location:** Find the Drift initialization script

**Fixed Code:**
```javascript
drift.on('ready', function() {
  drift.api.widget.setTheme('dark');
  drift.api.widget.setColors({
    primary: '#4F46E5',
    secondary: '#1F2937'
  });
});
```

---

## For Userlike

**Location:** Find the Userlike initialization script

**Fixed Code:**
```javascript
window.userlikeSettings = {
  theme: 'dark',
  primaryColor: '#4F46E5',
  backgroundColor: '#1F2937'
};
```

---

## Step 3: Implement Dynamic Theme Switching (Optional)

If you want the chat widget to automatically match the website theme:

```javascript
// Detect current theme
function getCurrentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Apply theme to chat widget
function applyChatTheme(theme) {
  if (typeof window.intercomSettings !== 'undefined') {
    window.intercomSettings.theme = theme;
    window.Intercom('update', { theme: theme });
  }
  // Add similar conditions for other chat services
}

// Watch for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      const theme = getCurrentTheme();
      applyChatTheme(theme);
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
});

// Apply theme on page load
applyChatTheme(getCurrentTheme());
```

---

## Step 4: Test the Implementation

1. Clear your browser cache
2. Visit tooljet.ai
3. Open the chat widget
4. Verify that it displays in dark theme
5. Test on different devices (desktop, mobile, tablet)

---

## Color Recommendations for ToolJet Brand

Based on the ToolJet website's dark theme, here are recommended colors:

- **Background:** `#1F2937` (Dark gray)
- **Primary Accent:** `#4F46E5` (Indigo/Purple)
- **Text:** `#F9FAFB` (Light gray/white)
- **Secondary:** `#374151` (Medium gray)

---

## Where to Make Changes

The marketing website (tooljet.ai) appears to be hosted separately from the main ToolJet application repository. The chat widget configuration is likely in one of these locations:

1. **Webflow Custom Code** (if using Webflow)
   - Go to Webflow Dashboard
   - Navigate to Site Settings → Custom Code
   - Add the theme configuration to the Footer Code section

2. **Direct HTML/JavaScript files**
   - Look for `index.html` or main template files
   - Find the chat widget script tag
   - Add theme configuration immediately after the widget initialization

3. **Google Tag Manager**
   - Some sites load chat widgets via GTM
   - Check GTM container for the chat widget tag
   - Edit the tag to include theme settings

4. **CMS Platform** (WordPress, Contentful, etc.)
   - Check the theme's custom scripts section
   - Add configuration via theme customizer or plugin settings

---

## Testing Checklist

- [ ] Chat widget loads successfully
- [ ] Dark theme is applied
- [ ] Colors match the website's dark theme
- [ ] Widget is readable in dark mode
- [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test widget interactions (open, close, send message)
- [ ] Verify no console errors

---

## Need Help?

If you encounter issues:

1. Check browser console for JavaScript errors
2. Verify the chat service API documentation for latest theme options
3. Contact the chat widget provider's support team
4. Test in incognito/private mode to rule out caching issues

---

## Additional Resources

- [Intercom Theme Customization](https://developers.intercom.com/installing-intercom/docs/customize-intercom-messenger)
- [Crisp Customization](https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/dollar-crisp/)
- [Zendesk Widget Customization](https://developer.zendesk.com/api-reference/widget/introduction/)
- [Tawk.to API Reference](https://developer.tawk.to/)
- [Drift Widget API](https://devdocs.drift.com/)
