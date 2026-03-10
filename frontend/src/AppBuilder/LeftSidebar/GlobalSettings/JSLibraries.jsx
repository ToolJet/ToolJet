import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import toast from 'react-hot-toast';
import { loadLibraryFromURL, initializeLibraries, executePreloadedJS } from '@/AppBuilder/_helpers/libraryLoader';

const JSLibraries = ({ darkMode }) => {
  const { globalSettings, globalSettingsChanged, jsLibraryRegistry, setJsLibraryRegistry } = useStore(
    (state) => ({
      globalSettings: state.globalSettings,
      globalSettingsChanged: state.globalSettingsChanged,
      jsLibraryRegistry: state.jsLibraryRegistry,
      setJsLibraryRegistry: state.setJsLibraryRegistry,
    }),
    shallow
  );

  const jsLibraries = globalSettings?.jsLibraries || [];
  const preloadedJS = globalSettings?.preloadedJS || '';

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showPreloadedJS, setShowPreloadedJS] = useState(false);

  const handleAddLibrary = async () => {
    if (!newUrl.trim() || !newName.trim()) {
      toast.error('Both name and URL are required');
      return;
    }

    if (jsLibraries.some((lib) => lib.name === newName.trim())) {
      toast.error(`A library with name "${newName.trim()}" already exists`);
      return;
    }

    setAdding(true);
    try {
      // Test loading the library before saving
      const module = await loadLibraryFromURL(newUrl.trim());
      if (module == null) {
        toast.error('Library loaded but exported nothing. Ensure it is a UMD/IIFE build.');
        setAdding(false);
        return;
      }

      const updatedLibraries = [...jsLibraries, { name: newName.trim(), url: newUrl.trim(), enabled: true }];
      await globalSettingsChanged({ jsLibraries: updatedLibraries });

      // Update the runtime registry
      const newRegistry = { ...jsLibraryRegistry, [newName.trim()]: module };
      setJsLibraryRegistry(newRegistry);

      setNewUrl('');
      setNewName('');
      toast.success(`Library "${newName.trim()}" added successfully`);
    } catch (error) {
      console.error('Failed to add library:', error);
      toast.error(`Failed to load library: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveLibrary = async (index) => {
    const lib = jsLibraries[index];
    const updatedLibraries = jsLibraries.filter((_, i) => i !== index);
    await globalSettingsChanged({ jsLibraries: updatedLibraries });

    // Remove from runtime registry
    const newRegistry = { ...jsLibraryRegistry };
    delete newRegistry[lib.name];
    setJsLibraryRegistry(newRegistry);
  };

  const handlePreloadedJSChange = async (value) => {
    await globalSettingsChanged({ preloadedJS: value });
  };

  const handleRunPreloadedJS = async () => {
    try {
      const preloadedExports = await executePreloadedJS(preloadedJS, jsLibraryRegistry);
      const fullRegistry = { ...jsLibraryRegistry };

      // Remove previous preloaded exports (keep only library entries)
      const libraryNames = new Set(jsLibraries.map((lib) => lib.name));
      for (const key of Object.keys(fullRegistry)) {
        if (!libraryNames.has(key)) delete fullRegistry[key];
      }

      // Merge new preloaded exports
      Object.assign(fullRegistry, preloadedExports);
      setJsLibraryRegistry(fullRegistry);

      const exportCount = Object.keys(preloadedExports).length;
      toast.success(
        exportCount > 0
          ? `Preloaded JS executed — ${exportCount} export${exportCount > 1 ? 's' : ''} available`
          : 'Preloaded JS executed (no exports returned)'
      );
    } catch (error) {
      toast.error('Preloaded JS failed: ' + error.message);
    }
  };

  const handleReloadLibraries = async () => {
    try {
      const registry = await initializeLibraries(jsLibraries);
      const preloadedExports = await executePreloadedJS(preloadedJS, registry);
      const fullRegistry = { ...registry, ...preloadedExports };
      setJsLibraryRegistry(fullRegistry);
      toast.success('Libraries reloaded successfully');
    } catch (error) {
      toast.error('Failed to reload libraries: ' + error.message);
    }
  };

  return (
    <div className="js-libraries-section">
      {/* Library list */}
      {jsLibraries.length > 0 && (
        <div className="js-libraries-list">
          {jsLibraries.map((lib, index) => (
            <div key={index} className="js-library-item">
              <div className="js-library-info">
                <span className="js-library-name">{lib.name}</span>
                <span className="js-library-url" title={lib.url}>
                  {lib.url.length > 40 ? lib.url.substring(0, 40) + '...' : lib.url}
                </span>
              </div>
              <button
                className="js-library-remove-btn"
                onClick={() => handleRemoveLibrary(index)}
                title="Remove library"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add library form */}
      <div className="js-library-add-form">
        <input
          type="text"
          className="js-library-input"
          placeholder="Variable name (e.g. Papa)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          data-cy="js-library-name-input"
        />
        <input
          type="text"
          className="js-library-input js-library-url-input"
          placeholder="URL (e.g. https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          data-cy="js-library-url-input"
        />
        <button
          className="js-library-add-btn"
          onClick={handleAddLibrary}
          disabled={adding}
          data-cy="js-library-add-btn"
        >
          {adding ? 'Loading...' : '+ Add library'}
        </button>
      </div>

      {/* Preloaded JavaScript section */}
      <div className="js-preloaded-section">
        <button className="js-preloaded-toggle" onClick={() => setShowPreloadedJS(!showPreloadedJS)}>
          <span>Preloaded JavaScript</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ transform: showPreloadedJS ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showPreloadedJS && (
          <div className="js-preloaded-editor">
            <textarea
              className="js-preloaded-textarea"
              placeholder={
                '// Define functions and variables, then return them.\n' +
                '// They become available in RunJS, transformations, and {{}} expressions.\n\n' +
                'function formatCurrency(amount) {\n' +
                "  return '$' + amount.toFixed(2);\n" +
                '}\n\n' +
                'return { formatCurrency };'
              }
              value={preloadedJS}
              onChange={(e) => handlePreloadedJSChange(e.target.value)}
              rows={8}
              data-cy="js-preloaded-textarea"
            />
            <button
              className="js-preloaded-run-btn"
              onClick={handleRunPreloadedJS}
              data-cy="js-preloaded-run-btn"
            >
              Run
            </button>
          </div>
        )}
      </div>

      {/* Reload button */}
      {jsLibraries.length > 0 && (
        <button className="js-library-reload-btn" onClick={handleReloadLibraries} data-cy="js-library-reload-btn">
          Reload all libraries
        </button>
      )}

      {/* Help text */}
      <div className="js-libraries-help-text">
        Use minified UMD builds (.min.js) from jsdelivr or cdnjs. ESM/CJS modules are not supported.
      </div>
    </div>
  );
};

export default JSLibraries;
