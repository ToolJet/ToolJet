# ToolJet Performance Debugging Guide: Large App Loading Issues

## 🔍 **Quick Diagnosis Steps**

### **Step 1: Enable Performance Monitoring**
The performance monitoring has been added to the codebase. To enable detailed logging:

```javascript
// In browser console or add to your development environment
localStorage.setItem('TOOLJET_DEBUG', 'true');
window.PERFORMANCE_DEBUG = true;
```

### **Step 2: Identify the Bottleneck Location**
When loading a large app, check the browser console for these performance markers:

```
🚀 [AppDataFetch] Started at...
⏱️ [AppDataFetch] Completed in XXX.XXms
🚀 [AppDataProcessing] Started at...
⏱️ [ComponentMapping] Completed in XXX.XXms
⏱️ [DependencyGraphInit] Completed in XXX.XXms
📊 Component Structure Analysis: {...}
📈 App Loading Performance Report: {...}
```

## 🎯 **Common Performance Bottlenecks & Solutions**

### **1. Large Component Count (>100 components)**
**Symptoms:**
- `ComponentMapping` takes >200ms
- High memory usage
- Browser becomes unresponsive

**Debug Steps:**
```javascript
// Check component count in console
const components = useStore.getState().modules.canvas.components;
console.log('Total components:', Object.keys(components).length);

// Analyze component structure
import { analyzeComponentStructure } from './frontend/src/AppBuilder/_helpers/performanceUtils';
const analysis = analyzeComponentStructure(components);
console.log('Component Analysis:', analysis);
```

**Solutions:**
- **Immediate**: Enable component virtualization for containers with many children
- **Medium-term**: Break down large components into smaller ones
- **Long-term**: Implement lazy loading for off-screen components

### **2. Deep Nesting (>10 levels)**
**Symptoms:**
- `DependencyGraphInit` takes >300ms
- Circular dependency warnings
- Slow UI interactions

**Debug Steps:**
```javascript
// Find deepest component nesting
function findDeepestNesting(components, depth = 0) {
  let maxDepth = depth;
  Object.values(components).forEach(component => {
    if (component.children) {
      const childDepth = findDeepestNesting(component.children, depth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  });
  return maxDepth;
}

const maxDepth = findDeepestNesting(components);
console.log('Maximum nesting depth:', maxDepth);
```

**Solutions:**
- Flatten component hierarchy where possible
- Use component references instead of deep nesting
- Implement dependency batching

### **3. Large Component Definitions (>10KB each)**
**Symptoms:**
- `AppDataProcessing` takes >1000ms
- High memory usage spikes
- JSON parsing delays

**Debug Steps:**
```javascript
// Find largest components
Object.entries(components).map(([id, component]) => ({
  id,
  size: JSON.stringify(component).length,
  type: component.component?.component
})).sort((a, b) => b.size - a.size).slice(0, 10);
```

**Solutions:**
- Split large components into smaller logical units
- Move large static data to external sources
- Use component templates/references

### **4. Synchronous Operations Blocking UI**
**Symptoms:**
- Warning: `⚠️ [Operation] SLOW OPERATION: XXXms`
- Browser freezes during load
- Unresponsive UI

**Debug Steps:**
```javascript
// Monitor main thread blocking
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 50) {
      console.warn('Long task detected:', entry.duration + 'ms');
    }
  });
});
observer.observe({ entryTypes: ['longtask'] });
```

**Solutions:**
- Use the async utilities in `performanceUtils.js`
- Implement batched processing
- Add `requestIdleCallback` for non-critical operations

## 🛠 **Performance Optimization Tools**

### **1. Browser DevTools Profiling**
```javascript
// Record performance profile
console.profile('AppLoad');
// Load your app
console.profileEnd('AppLoad');

// Or use Performance API
performance.mark('app-start');
// Load your app  
performance.mark('app-end');
performance.measure('app-load', 'app-start', 'app-end');
console.log(performance.getEntriesByName('app-load')[0]);
```

### **2. Memory Usage Monitoring**
```javascript
// Monitor memory usage
import { MemoryTracker } from './frontend/src/AppBuilder/_helpers/performanceUtils';

// Log current memory usage
MemoryTracker.logMemoryUsage('Custom Check');

// Enable automatic memory monitoring
setInterval(() => {
  MemoryTracker.logMemoryUsage('Periodic Check');
}, 10000);
```

### **3. Component Render Tracking**
```javascript
// Track specific component render times
import { perfMonitor } from './frontend/src/AppBuilder/_helpers/performanceUtils';

const MyComponent = perfMonitor.trackComponentRender('MyComponent', (props) => {
  // Component logic
  return <div>...</div>;
});
```

## ⚡ **Immediate Performance Fixes**

### **Fix 1: Enable Async Deep Cloning**
The codebase now uses `optimizedJSON.deepCloneAsync()` instead of `JSON.parse(JSON.stringify())` for large objects.

### **Fix 2: Component Virtualization**
For lists with many components:

```javascript
// Use react-window or react-virtualized
import { FixedSizeList as List } from 'react-window';

const VirtualizedComponentList = ({ components }) => (
  <List
    height={600}
    itemCount={components.length}
    itemSize={35}
    itemData={components}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <Component data={data[index]} />
      </div>
    )}
  </List>
);
```

### **Fix 3: Debounced Operations**
```javascript
import { debounce } from 'lodash';

// Debounce expensive operations
const debouncedUpdate = debounce((data) => {
  // Expensive operation
}, 300);
```

## 📊 **Performance Benchmarking**

### **Baseline Metrics for Large Apps**
- **Total Load Time**: <2000ms for apps with <200 components
- **Component Mapping**: <100ms
- **Dependency Graph**: <200ms
- **Memory Usage**: <50MB for typical large apps

### **Performance Regression Detection**
```javascript
// Add to your CI/CD pipeline
const PERFORMANCE_THRESHOLDS = {
  totalLoadTime: 3000, // 3 seconds
  componentMapping: 200, // 200ms
  dependencyGraph: 500, // 500ms
  memoryUsage: 100 * 1024 * 1024 // 100MB
};

// Check against thresholds
const report = perfMonitor.getReport();
Object.entries(PERFORMANCE_THRESHOLDS).forEach(([metric, threshold]) => {
  if (report[metric] > threshold) {
    console.error(`Performance regression detected in ${metric}: ${report[metric]} > ${threshold}`);
  }
});
```

## 🔧 **Advanced Debugging Techniques**

### **1. Component Dependency Analysis**
```javascript
// Analyze component dependencies
function analyzeComponentDependencies(components) {
  const dependencies = new Map();
  
  Object.entries(components).forEach(([id, component]) => {
    const deps = [];
    
    // Find references to other components
    JSON.stringify(component).replace(/"(\w+\.component)"/g, (match, ref) => {
      deps.push(ref);
    });
    
    dependencies.set(id, deps);
  });
  
  return dependencies;
}
```

### **2. Memory Leak Detection**
```javascript
// Monitor for memory leaks
let initialMemory = performance.memory?.usedJSHeapSize || 0;

setInterval(() => {
  const currentMemory = performance.memory?.usedJSHeapSize || 0;
  const growth = currentMemory - initialMemory;
  
  if (growth > 50 * 1024 * 1024) { // 50MB growth
    console.warn('Potential memory leak detected:', {
      initial: initialMemory,
      current: currentMemory,
      growth: growth
    });
  }
}, 30000);
```

### **3. Network Request Optimization**
```javascript
// Monitor network requests during app load
const requests = [];
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const start = performance.now();
  return originalFetch.apply(this, args).then(response => {
    const end = performance.now();
    requests.push({
      url: args[0],
      duration: end - start,
      size: response.headers.get('content-length')
    });
    return response;
  });
};
```

## 🎯 **Next Steps**

1. **Immediate**: Enable performance monitoring and identify current bottlenecks
2. **Short-term**: Implement async processing for identified slow operations
3. **Medium-term**: Add component virtualization for large lists
4. **Long-term**: Implement progressive loading and component streaming

## 📞 **Getting Help**

If you're still experiencing performance issues after following this guide:

1. Enable all debugging tools mentioned above
2. Collect performance data for your specific large app
3. Share the performance report and component analysis
4. Include specific symptoms and browser information

The performance monitoring is now built into the development environment and will help you identify exactly where the bottlenecks are occurring in your large apps.
