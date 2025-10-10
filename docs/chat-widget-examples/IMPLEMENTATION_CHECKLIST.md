# Implementation Checklist for tooljet.ai

## 🔍 Phase 1: Identification (5 minutes)

- [ ] Visit https://tooljet.ai in your browser
- [ ] Open Developer Tools (F12)
- [ ] Go to **Network** tab
- [ ] Look for chat widget service:
  - [ ] Check for `intercom.io` requests
  - [ ] Check for `crisp.chat` requests
  - [ ] Check for `zendesk.com` or `zdassets.com` requests
  - [ ] Check for `tawk.to` requests
  - [ ] Check for `drift.com` requests
- [ ] Note down which service is detected: _______________

## 📋 Phase 2: Locate Implementation (10 minutes)

The marketing website (tooljet.ai) is likely hosted on:

### Option A: Webflow
- [ ] Log into Webflow dashboard
- [ ] Navigate to **Site Settings** → **Custom Code**
- [ ] Check **Footer Code** section
- [ ] Find the chat widget script
- [ ] Note the location: _______________

### Option B: Static Site / CMS
- [ ] Find the website repository or CMS
- [ ] Locate the main HTML template
- [ ] Find the chat widget script (usually near `</body>`)
- [ ] Note the file path: _______________

### Option C: Google Tag Manager
- [ ] Log into GTM (Google Tag Manager)
- [ ] Find the chat widget tag
- [ ] Note the tag name: _______________

## 🛠️ Phase 3: Implementation (15 minutes)

### Quick Fix (Recommended)
Add the universal script right after the chat widget script:

```html
<!-- Existing chat widget script here -->

<!-- Add this immediately after -->
<script>
(function() {
  'use strict';
  const THEME_CONFIG = {
    backgroundColor: '#1F2937',
    primaryColor: '#4F46E5',
    textColor: '#F9FAFB',
    secondaryColor: '#374151',
    accentColor: '#818CF8'
  };

  function applyDarkTheme() {
    // For Intercom
    if (typeof window.Intercom === 'function') {
      window.intercomSettings = window.intercomSettings || {};
      window.intercomSettings.theme = 'dark';
      window.intercomSettings.background_color = THEME_CONFIG.backgroundColor;
      window.intercomSettings.action_color = THEME_CONFIG.primaryColor;
      window.Intercom('update', window.intercomSettings);
    }
    
    // For Crisp
    if (typeof window.$crisp !== 'undefined') {
      window.$crisp.push(["config", "color:theme", [THEME_CONFIG.backgroundColor]]);
      window.$crisp.push(["config", "color:button", [THEME_CONFIG.primaryColor]]);
    }
    
    // For Zendesk
    if (typeof window.zE === 'function') {
      window.zE('webWidget', 'updateSettings', {
        webWidget: {
          color: {
            theme: THEME_CONFIG.backgroundColor,
            launcher: THEME_CONFIG.primaryColor,
            launcherText: THEME_CONFIG.textColor
          }
        }
      });
    }
  }

  // Apply immediately and after delays
  setTimeout(applyDarkTheme, 100);
  setTimeout(applyDarkTheme, 1000);
  setTimeout(applyDarkTheme, 3000);
})();
</script>
```

**Implementation Steps:**
- [ ] Copy the script above
- [ ] Paste it after the chat widget script
- [ ] Save changes
- [ ] Proceed to testing

### Alternative: Service-Specific Fix
Choose based on your identified service:

#### For Intercom
- [ ] Find the `window.intercomSettings` configuration
- [ ] Add these lines:
  ```javascript
  theme: "dark",
  background_color: "#1F2937",
  action_color: "#4F46E5"
  ```
- [ ] Save changes

#### For Crisp
- [ ] Find the Crisp initialization code
- [ ] Add after `window.CRISP_WEBSITE_ID`:
  ```javascript
  window.$crisp.push(["config", "color:theme", ["#1F2937"]]);
  window.$crisp.push(["config", "color:button", ["#4F46E5"]]);
  ```
- [ ] Save changes

#### For Zendesk
- [ ] Find the `window.zESettings` configuration
- [ ] Add color configuration (see zendesk-dark-theme.html)
- [ ] Save changes

## 🧪 Phase 4: Testing (10 minutes)

### Local Testing (if applicable)
- [ ] Test on local/staging environment first
- [ ] Verify widget appears dark
- [ ] Check functionality (send test message)
- [ ] No JavaScript errors in console

### Production Testing
- [ ] Deploy to production
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Visit https://tooljet.ai
- [ ] Wait for chat widget to load
- [ ] **Visual Check:**
  - [ ] Widget button has dark theme
  - [ ] Widget window has dark background
  - [ ] Text is readable (proper contrast)
  - [ ] Colors match homepage theme
  - [ ] No flash of light theme before dark theme applies

### Cross-Browser Testing
- [ ] Chrome (Windows/Mac)
- [ ] Firefox
- [ ] Safari (Mac/iOS)
- [ ] Edge
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Functional Testing
- [ ] Click to open widget
- [ ] Start a conversation
- [ ] Send a test message
- [ ] Close widget
- [ ] Reopen widget (theme persists)

## 🐛 Phase 5: Troubleshooting

### Issue: Widget still appears in light mode
**Solutions to try:**
- [ ] Increase delay in setTimeout (try 5000ms)
- [ ] Check browser console for errors
- [ ] Verify chat service API key is correct
- [ ] Try applying theme via service's dashboard settings

### Issue: Widget flashes light then turns dark
**Solutions:**
- [ ] Apply theme earlier in page load
- [ ] Use CSS to hide widget until theme is applied
- [ ] Contact chat service support for native dark mode option

### Issue: Theme applies but colors don't match
**Solutions:**
- [ ] Verify color hex codes in THEME_CONFIG
- [ ] Check if service supports all color customizations
- [ ] Use browser DevTools to inspect widget colors

## 📊 Phase 6: Verification & Sign-off

### Final Checks
- [ ] Take screenshots (before/after)
- [ ] Document the implementation location
- [ ] Create backup of original code
- [ ] Update internal documentation
- [ ] Notify team of changes

### Performance Check
- [ ] Page load time not affected
- [ ] No JavaScript errors
- [ ] Widget loads properly
- [ ] No console warnings

### Accessibility Check
- [ ] Text contrast ratio meets WCAG standards
- [ ] Widget accessible via keyboard
- [ ] Screen reader compatible
- [ ] Focus indicators visible

## 📝 Documentation

### Record Implementation Details
```
Date implemented: _______________
Implemented by: _______________
Chat service: _______________
Implementation method: _______________
File location: _______________
Colors used:
  - Background: #1F2937
  - Primary: #4F46E5
  - Text: #F9FAFB
```

### Known Issues (if any)
```
Issue 1: _______________
Workaround: _______________

Issue 2: _______________
Workaround: _______________
```

## 🎉 Success Criteria

All of the following must be true:
- [x] Chat widget displays in dark theme
- [x] Colors match homepage dark theme
- [x] No visual inconsistencies
- [x] Widget remains functional
- [x] Works across all browsers
- [x] Works on mobile devices
- [x] No performance degradation
- [x] No JavaScript errors

---

## 📞 Support Contacts

If you need help:
- **Chat Service Support:** Check your chat provider's documentation
- **ToolJet Team:** Create an issue in the GitHub repository
- **Web Development:** Contact your web development team

---

## 🚀 Estimated Total Time
- **Identification:** 5 minutes
- **Locate Implementation:** 10 minutes  
- **Implementation:** 15 minutes
- **Testing:** 10 minutes
- **Total:** ~40 minutes

Good luck! 🌙
