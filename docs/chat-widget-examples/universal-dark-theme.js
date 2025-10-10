/**
 * Universal Chat Widget Dark Theme Manager
 * 
 * This script automatically detects and applies dark theme to popular chat widgets.
 * It supports: Intercom, Crisp, Zendesk, Tawk.to, Drift, and more.
 * 
 * Usage:
 * 1. Include this script after your chat widget initialization
 * 2. Or call applyDarkThemeToAllWidgets() after widgets load
 * 3. Configure colors in the THEME_CONFIG object below
 */

(function() {
  'use strict';

  // Theme Configuration
  const THEME_CONFIG = {
    backgroundColor: '#1F2937',    // Dark gray
    primaryColor: '#4F46E5',       // Indigo/Purple
    textColor: '#F9FAFB',          // Light text
    secondaryColor: '#374151',     // Medium gray
    accentColor: '#818CF8'         // Light indigo
  };

  /**
   * Detect current page theme
   */
  function getCurrentTheme() {
    const htmlClassList = document.documentElement.classList;
    const bodyClassList = document.body.classList;
    
    // Check for common dark theme class names
    if (htmlClassList.contains('dark') || 
        htmlClassList.contains('dark-theme') ||
        htmlClassList.contains('theme-dark') ||
        bodyClassList.contains('dark') ||
        bodyClassList.contains('dark-theme')) {
      return 'dark';
    }
    
    // Check for dark mode media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Check background color
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const rgb = bgColor.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      return brightness < 128 ? 'dark' : 'light';
    }
    
    return 'light';
  }

  /**
   * Apply dark theme to Intercom
   */
  function applyIntercomDarkTheme() {
    if (typeof window.Intercom === 'function') {
      console.log('✅ Applying dark theme to Intercom');
      
      window.intercomSettings = window.intercomSettings || {};
      window.intercomSettings.theme = 'dark';
      window.intercomSettings.background_color = THEME_CONFIG.backgroundColor;
      window.intercomSettings.action_color = THEME_CONFIG.primaryColor;
      
      try {
        window.Intercom('update', {
          theme: 'dark',
          background_color: THEME_CONFIG.backgroundColor,
          action_color: THEME_CONFIG.primaryColor
        });
      } catch (e) {
        console.warn('Intercom update failed:', e);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Apply dark theme to Crisp
   */
  function applyCrispDarkTheme() {
    if (typeof window.$crisp !== 'undefined') {
      console.log('✅ Applying dark theme to Crisp');
      
      try {
        window.$crisp.push(["safe", true]);
        window.$crisp.push(["config", "color:theme", [THEME_CONFIG.backgroundColor]]);
        window.$crisp.push(["config", "color:button", [THEME_CONFIG.primaryColor]]);
      } catch (e) {
        console.warn('Crisp configuration failed:', e);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Apply dark theme to Zendesk
   */
  function applyZendeskDarkTheme() {
    if (typeof window.zE === 'function') {
      console.log('✅ Applying dark theme to Zendesk');
      
      try {
        window.zE('webWidget', 'updateSettings', {
          webWidget: {
            color: {
              theme: THEME_CONFIG.backgroundColor,
              launcher: THEME_CONFIG.primaryColor,
              launcherText: THEME_CONFIG.textColor,
              button: THEME_CONFIG.primaryColor,
              header: '#111827',
              articleLinks: THEME_CONFIG.primaryColor
            }
          }
        });
      } catch (e) {
        console.warn('Zendesk update failed:', e);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Apply dark theme to Tawk.to
   */
  function applyTawkDarkTheme() {
    if (typeof window.Tawk_API !== 'undefined') {
      console.log('✅ Applying dark theme to Tawk.to');
      
      try {
        window.Tawk_API.onLoad = function() {
          window.Tawk_API.setAttributes({
            'theme': 'dark',
            'backgroundColor': THEME_CONFIG.backgroundColor,
            'primaryColor': THEME_CONFIG.primaryColor
          }, function(error) {
            if (error) console.warn('Tawk.to theme update failed:', error);
          });
        };
      } catch (e) {
        console.warn('Tawk.to configuration failed:', e);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Apply dark theme to Drift
   */
  function applyDriftDarkTheme() {
    if (typeof window.drift !== 'undefined') {
      console.log('✅ Applying dark theme to Drift');
      
      try {
        window.drift.on('ready', function() {
          window.drift.api.widget.setColors({
            primary: THEME_CONFIG.primaryColor,
            secondary: THEME_CONFIG.backgroundColor
          });
        });
      } catch (e) {
        console.warn('Drift configuration failed:', e);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Apply dark theme to Userlike
   */
  function applyUserlikeDarkTheme() {
    if (typeof window.userlikeSettings !== 'undefined') {
      console.log('✅ Applying dark theme to Userlike');
      
      window.userlikeSettings.theme = 'dark';
      window.userlikeSettings.primaryColor = THEME_CONFIG.primaryColor;
      window.userlikeSettings.backgroundColor = THEME_CONFIG.backgroundColor;
      
      return true;
    }
    return false;
  }

  /**
   * Apply dark theme to all detected widgets
   */
  function applyDarkThemeToAllWidgets() {
    const theme = getCurrentTheme();
    
    if (theme === 'light') {
      console.log('ℹ️ Light theme detected, skipping dark theme application');
      return;
    }
    
    console.log('🌙 Dark theme detected, applying to chat widgets...');
    
    let applied = false;
    
    // Try each widget
    applied = applyIntercomDarkTheme() || applied;
    applied = applyCrispDarkTheme() || applied;
    applied = applyZendeskDarkTheme() || applied;
    applied = applyTawkDarkTheme() || applied;
    applied = applyDriftDarkTheme() || applied;
    applied = applyUserlikeDarkTheme() || applied;
    
    if (!applied) {
      console.log('ℹ️ No supported chat widgets detected');
    } else {
      console.log('✨ Dark theme applied successfully to chat widgets');
    }
  }

  /**
   * Watch for theme changes and reapply
   */
  function watchForThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyDarkThemeToAllWidgets();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Initialize the theme manager
   */
  function init() {
    // Apply immediately
    applyDarkThemeToAllWidgets();
    
    // Apply after a delay to catch late-loading widgets
    setTimeout(applyDarkThemeToAllWidgets, 1000);
    setTimeout(applyDarkThemeToAllWidgets, 3000);
    setTimeout(applyDarkThemeToAllWidgets, 5000);
    
    // Watch for theme changes
    watchForThemeChanges();
    
    // Listen for prefers-color-scheme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addListener(applyDarkThemeToAllWidgets);
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose functions globally for manual control
  window.ChatWidgetDarkTheme = {
    apply: applyDarkThemeToAllWidgets,
    config: THEME_CONFIG,
    getCurrentTheme: getCurrentTheme
  };

})();
