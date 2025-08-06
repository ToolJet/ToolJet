import React, { useState, useMemo } from 'react';
import './IconShowcase.scss';

const IconShowcase = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [gridSize, setGridSize] = useState('medium');
  const [copiedText, setCopiedText] = useState('');

  // Dynamically import all bulk icons
  const getBulkIcons = () => {
    const icons = {};
    try {
      const bulkIconsContext = require.context('../../src/_ui/Icon/bulkIcons', false, /\.jsx$/);
      bulkIconsContext.keys().forEach((fileName) => {
        if (fileName === './index.js') return;
        const componentName = fileName.replace('./', '').replace('.jsx', '');
        try {
          icons[componentName] = bulkIconsContext(fileName).default;
        } catch (error) {
          console.warn(`Failed to load bulk icon: ${componentName}`, error);
        }
      });
    } catch (error) {
      console.error('Error loading bulk icons:', error);
    }
    return icons;
  };

  // Dynamically import all solid icons
  const getSolidIcons = () => {
    const icons = {};
    try {
      const solidIconsContext = require.context('../../src/_ui/Icon/solidIcons', false, /\.jsx$/);
      solidIconsContext.keys().forEach((fileName) => {
        if (fileName === './index.js') return;
        const componentName = fileName.replace('./', '').replace('.jsx', '');
        try {
          icons[componentName] = solidIconsContext(fileName).default;
        } catch (error) {
          console.warn(`Failed to load solid icon: ${componentName}`, error);
        }
      });
    } catch (error) {
      console.error('Error loading solid icons:', error);
    }
    return icons;
  };

  // Combine all icons with their metadata
  const allIcons = useMemo(() => {
    const icons = [];
    const bulkIcons = getBulkIcons();
    const solidIcons = getSolidIcons();

    // Add bulk icons
    Object.entries(bulkIcons).forEach(([componentName, Component]) => {
      icons.push({
        componentName,
        Component,
        type: 'bulk',
        id: `bulk-${componentName}`,
      });
    });

    // Add solid icons
    Object.entries(solidIcons).forEach(([componentName, Component]) => {
      icons.push({
        componentName,
        Component,
        type: 'solid',
        id: `solid-${componentName}`,
      });
    });

    return icons;
  }, []);

  // Filter icons based on search term and type
  const filteredIcons = useMemo(() => {
    return allIcons.filter((icon) => {
      const matchesSearch = icon.componentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || icon.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [allIcons, searchTerm, selectedType]);

  const copyToClipboard = async (text) => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(''), 2000);
        return;
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedText(text);
        setTimeout(() => setCopiedText(''), 2000);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Show error feedback
      setCopiedText('Failed to copy');
      setTimeout(() => setCopiedText(''), 2000);
    }
  };

  const getGridClass = () => {
    switch (gridSize) {
      case 'small':
        return 'grid-small';
      case 'large':
        return 'grid-large';
      default:
        return 'grid-medium';
    }
  };

  const bulkIconCount = allIcons.filter((icon) => icon.type === 'bulk').length;
  const solidIconCount = allIcons.filter((icon) => icon.type === 'solid').length;

  return (
    <div className="icon-showcase">
      <header className="showcase-header">
        <h1>ToolJet Icon Library</h1>
        <p>Browse and find icons easily with their component names</p>

        <div className="controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="filter-select">
              <option value="all">All Types ({allIcons.length})</option>
              <option value="bulk">Bulk Icons ({bulkIconCount})</option>
              <option value="solid">Solid Icons ({solidIconCount})</option>
            </select>
          </div>

          <div className="grid-size-container">
            <label>Grid Size:</label>
            <select value={gridSize} onChange={(e) => setGridSize(e.target.value)} className="grid-size-select">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div className="stats">
          Showing {filteredIcons.length} of {allIcons.length} icons
        </div>
      </header>

      <main className="showcase-content">
        <div className={`icons-grid ${getGridClass()}`}>
          {filteredIcons.map(({ componentName, Component, type, id }) => (
            <div key={id} className="icon-card">
              <div className="icon-preview">{Component ? <Component /> : <div>Error loading icon</div>}</div>
              <div className="icon-info">
                <div className="component-name" title={componentName}>
                  {componentName}
                </div>
                <div className="icon-type">{type}</div>
                <div className="copy-buttons">
                  <button
                    onClick={() => copyToClipboard(`<${componentName} />`)}
                    className={`copy-btn ${copiedText === `<${componentName} />` ? 'copied' : ''}`}
                    title="Copy component usage"
                  >
                    {copiedText === `<${componentName} />` ? '✓ Copied!' : 'Copy JSX'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(componentName)}
                    className={`copy-btn ${copiedText === componentName ? 'copied' : ''}`}
                    title="Copy component name"
                  >
                    {copiedText === componentName ? '✓ Copied!' : 'Copy Name'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredIcons.length === 0 && (
          <div className="no-results">
            <p>No icons found matching &quot;{searchTerm}&quot;</p>
            <button onClick={() => setSearchTerm('')} className="clear-search">
              Clear Search
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default IconShowcase;
