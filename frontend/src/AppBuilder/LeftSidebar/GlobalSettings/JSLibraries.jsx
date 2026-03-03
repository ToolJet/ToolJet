import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import toast from 'react-hot-toast';
import { loadLibraryFromURL, initializeLibraries, executeSetupScript } from '@/AppBuilder/_helpers/libraryLoader';

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
  const setupScript = globalSettings?.setupScript || '';

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showSetupScript, setShowSetupScript] = useState(false);

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

  const handleSetupScriptChange = async (value) => {
    await globalSettingsChanged({ setupScript: value });
  };

  const handleRunSetupScript = async () => {
    try {
      await executeSetupScript(setupScript, jsLibraryRegistry);
      toast.success('Setup script executed successfully');
    } catch (error) {
      toast.error('Setup script failed: ' + error.message);
    }
  };

  const handleReloadLibraries = async () => {
    try {
      const registry = await initializeLibraries(jsLibraries);
      setJsLibraryRegistry(registry);
      if (setupScript) {
        await executeSetupScript(setupScript, registry);
      }
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

      {/* Setup script section */}
      <div className="js-setup-script-section">
        <button className="js-setup-script-toggle" onClick={() => setShowSetupScript(!showSetupScript)}>
          <span>Setup script</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ transform: showSetupScript ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showSetupScript && (
          <div className="js-setup-script-editor">
            <textarea
              className="js-setup-script-textarea"
              placeholder="// Runs once after libraries load, before queries&#10;// e.g. dayjs.extend(dayjs_utc);"
              value={setupScript}
              onChange={(e) => handleSetupScriptChange(e.target.value)}
              rows={5}
              data-cy="js-setup-script-textarea"
            />
            <button
              className="js-setup-script-run-btn"
              onClick={handleRunSetupScript}
              data-cy="js-setup-script-run-btn"
            >
              Run script
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
