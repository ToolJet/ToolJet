#!/usr/bin/env node

/**
 * Enhanced Interactive Graph Wrapper
 *
 * This script wraps dependency-cruiser SVG output in an enhanced interactive HTML
 * with features like:
 * - Pan and zoom controls
 * - Opacity reduction for non-highlighted elements
 * - Directional edge highlighting (incoming vs outgoing)
 * - Cleaner visual appearance
 */

const fs = require('fs');
const path = require('path');

// Read SVG from stdin
let svgContent = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  svgContent += chunk;
});

process.stdin.on('end', () => {
  const html = generateEnhancedHTML(svgContent);
  process.stdout.write(html);
});

function generateEnhancedHTML(svgContent) {
  // Remove validation rule labels (like "no-circular") from edge labels
  svgContent = svgContent.replace(/<text[^>]*>\s*no-circular\s*<\/text>/gi, '');
  svgContent = svgContent.replace(/<text[^>]*>\s*no-orphans\s*<\/text>/gi, '');
  svgContent = svgContent.replace(/<text[^>]*>\s*warn\s*<\/text>/gi, '');
  svgContent = svgContent.replace(/<text[^>]*>\s*error\s*<\/text>/gi, '');

  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <title>Enhanced Dependency Graph</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        overflow: hidden;
        background: #f5f5f5;
      }

      #graph-container {
        width: 100vw;
        height: 100vh;
        position: relative;
        background: white;
      }

      svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* Enhanced node styles */
      .node {
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .node path,
      .node polygon,
      .node ellipse {
        transition: all 0.2s ease;
      }

      /* Highlighted nodes */
      .node.highlighted path,
      .node.highlighted polygon,
      .node.highlighted ellipse {
        stroke: #ff00ff !important;
        stroke-width: 3 !important;
        filter: drop-shadow(0 0 8px rgba(255, 0, 255, 0.6));
      }

      /* Dimmed nodes (when others are highlighted) */
      .node.dimmed {
        opacity: 0.15;
      }

      /* Source node (the one clicked/selected) */
      .node.source path,
      .node.source polygon,
      .node.source ellipse {
        stroke: #00d4ff !important;
        stroke-width: 4 !important;
        fill: #e6f7ff !important;
        filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.8));
      }

      /* Edge styles */
      .edge {
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .edge path,
      .edge polygon {
        transition: all 0.2s ease;
      }

      /* Outgoing edges (from selected node) */
      .edge.outgoing path {
        stroke: #00ff88 !important;
        stroke-width: 3 !important;
        stroke-opacity: 1 !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 136, 0.6));
      }

      .edge.outgoing polygon {
        stroke: #00ff88 !important;
        fill: #00ff88 !important;
        stroke-width: 2 !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 136, 0.6));
      }

      /* Incoming edges (to selected node) */
      .edge.incoming path {
        stroke: #ff6b6b !important;
        stroke-width: 3 !important;
        stroke-opacity: 1 !important;
        filter: drop-shadow(0 0 4px rgba(255, 107, 107, 0.6));
      }

      .edge.incoming polygon {
        stroke: #ff6b6b !important;
        fill: #ff6b6b !important;
        stroke-width: 2 !important;
        filter: drop-shadow(0 0 4px rgba(255, 107, 107, 0.6));
      }

      /* Dimmed edges */
      .edge.dimmed {
        opacity: 0.08;
      }

      /* Hide edge labels by default (they clutter the view) */
      .edge text {
        display: none;
      }

      /* Cluster styles */
      .cluster {
        transition: opacity 0.2s ease;
      }

      .cluster.dimmed {
        opacity: 0.2;
      }

      /* Controls */
      #controls {
        position: fixed;
        top: 20px;
        left: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 16px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .control-group {
        display: flex;
        gap: 8px;
      }

      button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }

      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      button:active {
        transform: translateY(0);
      }

      button.reset {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      button.help {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        width: 40px;
        height: 40px;
        padding: 0;
        font-size: 20px;
      }

      /* Legend */
      #legend {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 16px;
        z-index: 1000;
        font-size: 13px;
        line-height: 1.6;
      }

      #legend h3 {
        margin-bottom: 12px;
        font-size: 15px;
        color: #333;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .legend-color {
        width: 30px;
        height: 3px;
        border-radius: 2px;
      }

      .legend-color.outgoing {
        background: #00ff88;
      }

      .legend-color.incoming {
        background: #ff6b6b;
      }

      .legend-color.selected {
        background: #00d4ff;
        height: 4px;
      }

      /* Help modal */
      #help-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
        padding: 32px;
        z-index: 2000;
        max-width: 500px;
        display: none;
      }

      #help-modal.visible {
        display: block;
      }

      #help-modal h2 {
        margin-bottom: 20px;
        color: #333;
      }

      #help-modal ul {
        list-style: none;
        padding: 0;
      }

      #help-modal li {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }

      #help-modal li:last-child {
        border-bottom: none;
      }

      #help-modal kbd {
        background: #f5f5f5;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 2px 8px;
        font-family: monospace;
        font-size: 12px;
      }

      #overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1999;
        display: none;
      }

      #overlay.visible {
        display: block;
      }

      /* Zoom level indicator */
      #zoom-indicator {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        color: #666;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }

      @media print {
        #controls,
        #legend,
        #help-modal,
        #overlay,
        #zoom-indicator {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div id="overlay"></div>

    <div id="controls">
      <div class="control-group">
        <button id="zoom-in" title="Zoom In">🔍+</button>
        <button id="zoom-out" title="Zoom Out">🔍−</button>
        <button id="zoom-reset" title="Reset Zoom">⟲</button>
      </div>
      <div class="control-group">
        <button class="reset" id="clear-selection" title="Clear Selection">Clear</button>
      </div>
      <div class="control-group">
        <button class="help" id="help-btn" title="Help">?</button>
      </div>
    </div>

    <div id="legend">
      <h3>Edge Colors</h3>
      <div class="legend-item">
        <div class="legend-color selected"></div>
        <span>Selected Node</span>
      </div>
      <div class="legend-item">
        <div class="legend-color outgoing"></div>
        <span>Outgoing (this → other)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color incoming"></div>
        <span>Incoming (other → this)</span>
      </div>
    </div>

    <div id="zoom-indicator">
      Zoom: <span id="zoom-level">100%</span>
    </div>

    <div id="help-modal">
      <h2>Keyboard Shortcuts & Controls</h2>
      <ul>
        <li><kbd>Click</kbd> on node - Highlight dependencies</li>
        <li><kbd>Right-click</kbd> on node - Pin selection</li>
        <li><kbd>ESC</kbd> - Clear selection</li>
        <li><kbd>Mouse Wheel</kbd> - Zoom in/out</li>
        <li><kbd>Click + Drag</kbd> - Pan around</li>
        <li><kbd>+</kbd> / <kbd>-</kbd> - Zoom in/out</li>
        <li><kbd>0</kbd> - Reset zoom</li>
        <li><kbd>F1</kbd> or <kbd>?</kbd> - Toggle this help</li>
      </ul>
      <p style="margin-top: 20px; color: #666; font-size: 13px;">
        <strong>Edge Colors:</strong><br>
        🟢 Green = Outgoing dependencies (this file imports...)<br>
        🔴 Red = Incoming dependencies (...imports this file)<br>
        🔵 Blue = Selected node
      </p>
      <button id="close-help" style="margin-top: 20px; width: 100%;">Close</button>
    </div>

    <div id="graph-container">
      ${svgContent}
    </div>

    <script>
      // Graph state
      let currentScale = 1;
      let currentX = 0;
      let currentY = 0;
      let isPanning = false;
      let startX, startY;
      let selectedNode = null;
      let isPinned = false;

      const svg = document.querySelector('svg');
      const graphContainer = document.getElementById('graph-container');
      const zoomLevelSpan = document.getElementById('zoom-level');

      // Initialize SVG viewBox for proper zooming
      if (!svg.getAttribute('viewBox')) {
        const bbox = svg.getBBox();
        svg.setAttribute('viewBox', \`\${bbox.x} \${bbox.y} \${bbox.width} \${bbox.height}\`);
      }

      // Get the original viewBox
      const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
      const [origX, origY, origWidth, origHeight] = viewBox;

      // Build dependency map for directional highlighting
      const dependencyMap = buildDependencyMap();

      function buildDependencyMap() {
        const map = new Map();
        const nodes = Array.from(document.querySelectorAll('.node'));
        const edges = Array.from(document.querySelectorAll('.edge'));

        // Extract node IDs
        nodes.forEach(node => {
          const title = node.querySelector('title')?.textContent?.trim();
          if (title) {
            map.set(title, { outgoing: [], incoming: [], element: node });
          }
        });

        // Build edges
        edges.forEach(edge => {
          const title = edge.querySelector('title')?.textContent?.trim();
          if (title) {
            // Edge titles are usually in format "source->target" or "source-&gt;target"
            const match = title.match(/(.+?)(?:->|&gt;)(.+)/);
            if (match) {
              const [, source, target] = match;
              const sourceTrim = source.trim();
              const targetTrim = target.trim();

              if (map.has(sourceTrim)) {
                map.get(sourceTrim).outgoing.push({ edge, target: targetTrim });
              }
              if (map.has(targetTrim)) {
                map.get(targetTrim).incoming.push({ edge, source: sourceTrim });
              }
            }
          }
        });

        return map;
      }

      // Zoom functions
      function updateZoom() {
        const newWidth = origWidth / currentScale;
        const newHeight = origHeight / currentScale;
        const newX = origX - currentX;
        const newY = origY - currentY;

        svg.setAttribute('viewBox', \`\${newX} \${newY} \${newWidth} \${newHeight}\`);
        zoomLevelSpan.textContent = Math.round(currentScale * 100) + '%';
      }

      function zoomIn() {
        currentScale = Math.min(currentScale * 1.2, 10);
        updateZoom();
      }

      function zoomOut() {
        currentScale = Math.max(currentScale / 1.2, 0.1);
        updateZoom();
      }

      function resetZoom() {
        currentScale = 1;
        currentX = 0;
        currentY = 0;
        updateZoom();
      }

      // Pan functions
      graphContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !e.target.closest('.node, .edge')) {
          isPanning = true;
          startX = e.clientX;
          startY = e.clientY;
          graphContainer.style.cursor = 'grabbing';
        }
      });

      document.addEventListener('mousemove', (e) => {
        if (isPanning) {
          const dx = (e.clientX - startX) / currentScale;
          const dy = (e.clientY - startY) / currentScale;
          currentX -= dx;
          currentY -= dy;
          startX = e.clientX;
          startY = e.clientY;
          updateZoom();
        }
      });

      document.addEventListener('mouseup', () => {
        if (isPanning) {
          isPanning = false;
          graphContainer.style.cursor = 'default';
        }
      });

      // Mouse wheel zoom
      graphContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      });

      // Button controls
      document.getElementById('zoom-in').addEventListener('click', zoomIn);
      document.getElementById('zoom-out').addEventListener('click', zoomOut);
      document.getElementById('zoom-reset').addEventListener('click', resetZoom);

      // Selection and highlighting
      function clearHighlights() {
        document.querySelectorAll('.node, .edge, .cluster').forEach(el => {
          el.classList.remove('highlighted', 'dimmed', 'source', 'outgoing', 'incoming');
        });
        selectedNode = null;
        isPinned = false;
      }

      function highlightNode(nodeElement) {
        if (!nodeElement) return;

        const title = nodeElement.querySelector('title')?.textContent?.trim();
        if (!title || !dependencyMap.has(title)) return;

        clearHighlights();
        selectedNode = nodeElement;

        const deps = dependencyMap.get(title);

        // Mark selected node
        nodeElement.classList.add('source');

        // Collect all highlighted elements
        const highlightedNodes = new Set([nodeElement]);
        const highlightedEdges = new Set();

        // Highlight outgoing dependencies (green)
        deps.outgoing.forEach(({ edge, target }) => {
          edge.classList.add('outgoing', 'highlighted');
          highlightedEdges.add(edge);

          if (dependencyMap.has(target)) {
            const targetNode = dependencyMap.get(target).element;
            targetNode.classList.add('highlighted');
            highlightedNodes.add(targetNode);
          }
        });

        // Highlight incoming dependencies (red)
        deps.incoming.forEach(({ edge, source }) => {
          edge.classList.add('incoming', 'highlighted');
          highlightedEdges.add(edge);

          if (dependencyMap.has(source)) {
            const sourceNode = dependencyMap.get(source).element;
            sourceNode.classList.add('highlighted');
            highlightedNodes.add(sourceNode);
          }
        });

        // Dim all other elements
        document.querySelectorAll('.node').forEach(node => {
          if (!highlightedNodes.has(node)) {
            node.classList.add('dimmed');
          }
        });

        document.querySelectorAll('.edge').forEach(edge => {
          if (!highlightedEdges.has(edge)) {
            edge.classList.add('dimmed');
          }
        });

        document.querySelectorAll('.cluster').forEach(cluster => {
          cluster.classList.add('dimmed');
        });
      }

      // Node click events
      document.querySelectorAll('.node').forEach(node => {
        node.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          highlightNode(node);
          isPinned = true;
        });

        node.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          highlightNode(node);
          isPinned = true;
        });

        node.addEventListener('mouseenter', (e) => {
          if (!isPinned) {
            highlightNode(node);
          }
        });
      });

      // Clear selection
      document.getElementById('clear-selection').addEventListener('click', clearHighlights);

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'Escape':
            clearHighlights();
            break;
          case '+':
          case '=':
            zoomIn();
            break;
          case '-':
          case '_':
            zoomOut();
            break;
          case '0':
            resetZoom();
            break;
          case 'F1':
          case '?':
            e.preventDefault();
            toggleHelp();
            break;
        }
      });

      // Help modal
      const helpModal = document.getElementById('help-modal');
      const overlay = document.getElementById('overlay');

      function toggleHelp() {
        helpModal.classList.toggle('visible');
        overlay.classList.toggle('visible');
      }

      document.getElementById('help-btn').addEventListener('click', toggleHelp);
      document.getElementById('close-help').addEventListener('click', toggleHelp);
      overlay.addEventListener('click', toggleHelp);

      // Initialize
      updateZoom();
      console.log('Enhanced dependency graph loaded');
      console.log('Found', dependencyMap.size, 'nodes');
    </script>
  </body>
</html>`;
}
