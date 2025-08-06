/**
 * ToolJet Store Diagnostics - Run this in browser console to analyze your app
 * This script finds the store data through various methods
 */

(function () {
  console.log('🔍 ToolJet Store Diagnostics Starting...');

  // Method 1: Try to find store through React DevTools
  function findStoreViaReact() {
    try {
      // Look for React fiber nodes that might contain the store
      const allElements = document.querySelectorAll('*');

      for (let element of allElements) {
        const reactKey = Object.keys(element).find(key =>
          key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
        );

        if (reactKey) {
          const fiber = element[reactKey];

          // Traverse up the fiber tree looking for store
          let current = fiber;
          while (current) {
            if (current.memoizedProps && current.memoizedProps.store) {
              return current.memoizedProps.store;
            }
            if (current.memoizedState && current.memoizedState.store) {
              return current.memoizedState.store;
            }
            current = current.return;
          }
        }
      }
    } catch (e) {
      console.log('React method failed:', e.message);
    }
    return null;
  }

  // Method 2: Try to find store via window object
  function findStoreViaWindow() {
    const possiblePaths = [
      'window.__TOOLJET_STORE__',
      'window.store',
      'window.__store__',
      'window.useStore',
      'window.appStore'
    ];

    for (let path of possiblePaths) {
      try {
        const store = eval(path);
        if (store && typeof store.getState === 'function') {
          return store;
        }
      } catch (e) {
        // Path doesn't exist, continue
      }
    }
    return null;
  }

  // Method 3: Try to find store via DOM data attributes
  function findStoreViaDOM() {
    try {
      // Look for common ToolJet containers
      const containers = [
        '[data-cy="app-builder"]',
        '[data-testid="app-builder"]',
        '.app-builder',
        '#app-builder',
        '.editor-container'
      ];

      for (let selector of containers) {
        const element = document.querySelector(selector);
        if (element) {
          // Check if the element has store data
          const reactProps = Object.keys(element).find(key => key.startsWith('__react'));
          if (reactProps && element[reactProps]) {
            const fiber = element[reactProps];
            if (fiber.memoizedProps && fiber.memoizedProps.children) {
              // Sometimes store is passed through context
              console.log('Found potential store container:', element);
            }
          }
        }
      }
    } catch (e) {
      console.log('DOM method failed:', e.message);
    }
    return null;
  }

  // Method 4: Try to extract data from Redux DevTools
  function findStoreViaReduxDevTools() {
    try {
      if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
        // Redux DevTools might have store reference
        console.log('Redux DevTools found, but store access limited');
      }
    } catch (e) {
      console.log('Redux DevTools method failed:', e.message);
    }
    return null;
  }

  // Method 5: Try to find components data in localStorage or sessionStorage
  function findDataViaStorage() {
    try {
      const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
      const tooljetKeys = keys.filter(key =>
        key.includes('tooljet') ||
        key.includes('components') ||
        key.includes('app') ||
        key.includes('store')
      );

      if (tooljetKeys.length > 0) {
        console.log('Found potential ToolJet data in storage:', tooljetKeys);

        for (let key of tooljetKeys) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key));
            if (data && data.components) {
              console.log(`Found components data in ${key}:`, Object.keys(data.components).length, 'components');
              return { components: data.components };
            }
          } catch (e) {
            // Not JSON data
          }
        }
      }
    } catch (e) {
      console.log('Storage method failed:', e.message);
    }
    return null;
  }

  // Method 6: Alternative - extract from network requests
  function monitorNetworkForData() {
    console.log('📡 Monitoring network requests for app data...');
    console.log('💡 Reload the page and this script will capture app data from API responses');

    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      return originalFetch.apply(this, args).then(response => {
        const url = args[0];
        if (url.includes('/api/apps/') || url.includes('/api/app/') || url.includes('apps')) {
          response.clone().json().then(data => {
            if (data && (data.editing_version || data.definition || data.components)) {
              console.log('🎯 Found app data from API:', url);
              window.__TOOLJET_APP_DATA__ = data;
              analyzeAppData(data);
            }
          }).catch(() => {
            // Not JSON response
          });
        }
        return response;
      });
    };
  }

  // Main analysis function
  function analyzeAppData(data) {
    console.log('\n📊 ===== APP DATA ANALYSIS =====');

    let components = null;

    // Try different data structures
    if (data.components) {
      components = data.components;
    } else if (data.editing_version && data.editing_version.definition) {
      components = data.editing_version.definition.components;
    } else if (data.definition && data.definition.components) {
      components = data.definition.components;
    } else if (data.modules && data.modules.canvas && data.modules.canvas.components) {
      components = data.modules.canvas.components;
    }

    if (!components) {
      console.warn('❌ Could not find components data in the provided structure');
      console.log('Available keys:', Object.keys(data));
      return null;
    }

    const componentCount = Object.keys(components).length;
    const componentTypes = Object.values(components).reduce((acc, comp) => {
      let type = 'unknown';

      // Try different component type structures
      if (comp.component && comp.component.component) {
        type = comp.component.component;
      } else if (comp.component) {
        type = comp.component;
      } else if (comp.type) {
        type = comp.type;
      }

      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const topTypes = Object.entries(componentTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`📋 Total Components: ${componentCount}`);
    console.log('🏆 Top Component Types:', topTypes);

    // Analyze component sizes
    const componentSizes = Object.entries(components).map(([id, comp]) => ({
      id,
      size: JSON.stringify(comp).length,
      type: comp.component?.component || comp.component || comp.type || 'unknown'
    })).sort((a, b) => b.size - a.size);

    console.log('📏 Largest Components:');
    componentSizes.slice(0, 5).forEach((comp, i) => {
      console.log(`  ${i + 1}. ${comp.id} (${comp.type}): ${(comp.size / 1024).toFixed(1)}KB`);
    });

    // Performance estimates
    const estimatedDepGraphTime = Math.max(100, componentCount * 20 + topTypes.length * 100);
    console.log(`\n⏱️ Performance Estimates:`);
    console.log(`  Expected Dependency Graph Time: ~${estimatedDepGraphTime}ms`);

    if (componentCount > 200) {
      console.warn('⚠️ HIGH COMPONENT COUNT - This is likely causing the 7.1s dependency graph time');
    }

    if (componentSizes[0].size > 50000) {
      console.warn('⚠️ VERY LARGE COMPONENTS - Consider breaking down large components');
    }

    // Update the tracker with real data
    console.log('\n📝 Copy this data to PERFORMANCE_IMPROVEMENT_TRACKER.md:');
    console.log(`Component Count: ${componentCount}`);
    console.log(`Top Component Types: ${topTypes.map(([type, count]) => `${type}(${count})`).join(', ')}`);

    return {
      componentCount,
      componentTypes,
      topTypes,
      largestComponents: componentSizes.slice(0, 5),
      estimatedDepGraphTime
    };
  }

  // Try all methods to find the store
  console.log('🔍 Trying multiple methods to find ToolJet store...');

  let store = findStoreViaWindow();
  if (store) {
    console.log('✅ Found store via window object');
    const state = store.getState();
    analyzeAppData(state);
    return;
  }

  store = findStoreViaReact();
  if (store) {
    console.log('✅ Found store via React DevTools');
    const state = store.getState();
    analyzeAppData(state);
    return;
  }

  const storageData = findDataViaStorage();
  if (storageData) {
    console.log('✅ Found data via browser storage');
    analyzeAppData(storageData);
    return;
  }

  // If no direct access, monitor network
  console.log('📡 No direct store access found. Monitoring network requests...');
  console.log('💡 PLEASE RELOAD THE PAGE to capture app data from API');
  monitorNetworkForData();

  // Alternative manual method
  console.log('\n🔧 ALTERNATIVE: Manual Component Count');
  console.log('If you can see the app builder interface, try:');
  console.log('1. Open browser DevTools → Elements tab');
  console.log('2. Search for "data-cy" or look for component containers');
  console.log('3. Count visible components manually');
  console.log('4. Look for component panels or lists in the UI');

  // Set up global helper
  window.analyzeToolJetApp = analyzeAppData;
  console.log('\n🛠️ Global helper created: window.analyzeToolJetApp(data)');
  console.log('If you have app data, pass it to: window.analyzeToolJetApp(yourAppData)');
})();

console.log('\n📋 ===== NEXT STEPS =====');
console.log('1. If data was found above ✅ - Copy the component count to tracker');
console.log('2. If monitoring network 📡 - Reload the page now');
console.log('3. If no data found ❌ - Try the manual counting method');
console.log('4. Report back with: Component count, browser type, and app type');
