import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, { Background, Controls, MiniMap, Handle, Position, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import useStore from '@/AppBuilder/_stores/store';
import { decodeEntities } from '@/_helpers/utils';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';
import { XIcon } from 'lucide-react';
import { getPageDependencyGraph } from '@/AppBuilder/_utils/entityUsage';
import useEntityNavigation, { KIND_LABELS, NAVIGABLE_KINDS } from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';
import './dependencyGraphOverlay.scss';

// Column group per entity kind: inputs (variables/globals/constants) -> queries -> components.
const KIND_GROUP = {
  variable: 0,
  pageVariable: 0,
  global: 0,
  constant: 0,
  page: 0,
  unknown: 0,
  query: 1,
  component: 2,
};

const MAX_ROWS = 20; // wrap kind-groups into sub-columns so canvas height stays bounded
const SUBCOL_WIDTH = 300;
const ROW_HEIGHT = 64;
const GROUP_GAP = 80;

const DEPTH_OPTIONS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: 'All', value: Infinity },
];

const EntityNode = ({ data }) => (
  <div
    className={`dep-graph-node ${data.dimmed ? 'dimmed' : ''} ${data.navigable ? 'navigable' : ''} ${
      data.focused ? 'focused' : ''
    }`}
  >
    <Handle type="target" position={Position.Left} className="dep-graph-handle" isConnectable={false} />
    <span className={`entity-usage-kind entity-usage-kind-${data.kind}`}>{KIND_LABELS[data.kind]}</span>
    <span className="dep-graph-node-name text-truncate">{decodeEntities(data.name)}</span>
    <Handle type="source" position={Position.Right} className="dep-graph-handle" isConnectable={false} />
  </div>
);

const nodeTypes = { entity: EntityNode };

// Inner canvas so useReactFlow() can refit the view when the visible set changes
// without remounting ReactFlow (a remount would swallow double-clicks).
const GraphCanvas = ({ nodes, edges, refitKey, onNodeClick, onNodeDoubleClick, setHoveredNodeId }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const frame = requestAnimationFrame(() => fitView({ padding: 0.2, maxZoom: 1 }));
    return () => cancelAnimationFrame(frame);
  }, [refitKey, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.1}
      nodesConnectable={false}
      onlyRenderVisibleElements
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onNodeMouseEnter={(event, node) => setHoveredNodeId(node.id)}
      onNodeMouseLeave={() => setHoveredNodeId(null)}
    >
      <Background gap={16} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
};

// Full-screen visual dependency graph for the current page.
// Defaults to the connected subgraph only; click a node to focus on its
// N-hop neighborhood (lineage-tool UX), double-click to navigate to it.
const DependencyGraphOverlay = ({ onClose, moduleId, darkMode, initialFocus = null }) => {
  const [searchValue, setSearchValue] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(initialFocus);
  const [depth, setDepth] = useState(1);
  const [showUnconnected, setShowUnconnected] = useState(false);
  const navigateToEntity = useEntityNavigation();

  // Snapshot on open — the overlay blocks editing, so live recompute is unnecessary.
  const graph = useMemo(() => getPageDependencyGraph(useStore.getState(), moduleId), [moduleId]);

  const adjacency = useMemo(() => {
    const adj = new Map();
    graph.nodes.forEach((node) => adj.set(node.id, new Set()));
    graph.edges.forEach((edge) => {
      adj.get(edge.source)?.add(edge.target);
      adj.get(edge.target)?.add(edge.source);
    });
    return adj;
  }, [graph]);

  const focusId = focusedNodeId && adjacency.has(focusedNodeId) ? focusedNodeId : null;
  const focusedNode = focusId ? graph.nodes.find((node) => node.id === focusId) : null;

  const isolatedCount = useMemo(
    () => graph.nodes.filter((node) => (adjacency.get(node.id)?.size ?? 0) === 0).length,
    [graph, adjacency]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Visible set: BFS neighborhood when focused, connected subgraph otherwise.
  const visibleIds = useMemo(() => {
    if (focusId) {
      const visited = new Set([focusId]);
      let frontier = [focusId];
      let hops = 0;
      while (frontier.length && hops < depth) {
        const next = [];
        frontier.forEach((id) => {
          adjacency.get(id)?.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              next.push(neighbor);
            }
          });
        });
        frontier = next;
        hops += 1;
      }
      return visited;
    }
    const visible = new Set();
    graph.nodes.forEach((node) => {
      if (showUnconnected || (adjacency.get(node.id)?.size ?? 0) > 0) visible.add(node.id);
    });
    return visible;
  }, [graph, adjacency, focusId, depth, showUnconnected]);

  const nodes = useMemo(() => {
    const term = searchValue.toLowerCase();
    const groups = [[], [], []];
    graph.nodes
      .filter((node) => visibleIds.has(node.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((node) => groups[KIND_GROUP[node.kind] ?? 0].push(node));

    const result = [];
    let xOffset = 0;
    groups.forEach((groupNodes) => {
      if (!groupNodes.length) return;
      groupNodes.forEach((node, index) => {
        const subColumn = Math.floor(index / MAX_ROWS);
        const row = index % MAX_ROWS;
        result.push({
          id: node.id,
          type: 'entity',
          position: { x: xOffset + subColumn * SUBCOL_WIDTH, y: row * ROW_HEIGHT },
          data: {
            kind: node.kind,
            name: node.name,
            entityId: node.entityId,
            navigable: NAVIGABLE_KINDS.has(node.kind),
            dimmed: Boolean(term) && !node.name.toLowerCase().includes(term),
            focused: node.id === focusId,
          },
        });
      });
      xOffset += Math.ceil(groupNodes.length / MAX_ROWS) * SUBCOL_WIDTH + GROUP_GAP;
    });
    return result;
  }, [graph, visibleIds, searchValue, focusId]);

  const edges = useMemo(
    () =>
      graph.edges
        .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
        .map((edge) => {
          const isHighlighted = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: edge.kind === 'triggers',
            className: `dep-graph-edge ${edge.kind} ${isHighlighted ? 'highlighted' : ''} ${
              hoveredNodeId && !isHighlighted ? 'muted' : ''
            }`,
          };
        }),
    [graph, visibleIds, hoveredNodeId]
  );

  const handleNodeClick = (event, node) => {
    setFocusedNodeId(node.id);
  };

  const handleNodeDoubleClick = (event, node) => {
    const navigated = navigateToEntity({ kind: node.data.kind, id: node.data.entityId, name: node.data.name });
    if (navigated) onClose();
  };

  const refitKey = `${focusId ?? 'none'}|${depth}|${showUnconnected}`;

  return createPortal(
    <div className={`dependency-graph-overlay ${darkMode ? 'dark-theme theme-dark' : ''}`}>
      <div className="dependency-graph-header">
        <span className="dependency-graph-title" data-cy="dependency-graph-title">
          Dependency graph
        </span>
        <div className="dependency-graph-search">
          <InputComponent
            leadingIcon="search01"
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            size="medium"
            placeholder="Search entities"
            value={searchValue}
            {...(searchValue && { trailingAction: 'clear' })}
            data-cy="dependency-graph-search-input"
          />
        </div>

        {focusedNode ? (
          <>
            <span className="dependency-graph-focus-chip" data-cy="dependency-graph-focus-chip">
              <span className="text-truncate">{decodeEntities(focusedNode.name)}</span>
              <span
                className="dependency-graph-focus-clear"
                role="button"
                onClick={() => setFocusedNodeId(null)}
                data-cy="dependency-graph-clear-focus"
              >
                <XIcon size={12} />
              </span>
            </span>
            <div className="dependency-graph-depth" data-cy="dependency-graph-depth">
              {DEPTH_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  className={`dependency-graph-depth-option ${depth === option.value ? 'active' : ''}`}
                  onClick={() => setDepth(option.value)}
                  data-cy={`dependency-graph-depth-${option.label.toLowerCase()}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <label className="dependency-graph-toggle">
            <input
              type="checkbox"
              checked={showUnconnected}
              onChange={(e) => setShowUnconnected(e.target.checked)}
              data-cy="dependency-graph-show-unconnected"
            />
            Show unconnected ({isolatedCount})
          </label>
        )}

        <span className="dependency-graph-counter">
          {nodes.length} nodes · {edges.length} edges
        </span>

        <div className="dependency-graph-header-right">
          <span className="dependency-graph-hint">click to focus · double-click to open</span>
          <div className="dependency-graph-legend">
            <span className="dependency-graph-legend-item binds">binds</span>
            <span className="dependency-graph-legend-item triggers">triggers</span>
          </div>
          <ButtonComponent
            iconOnly
            leadingIcon="x"
            onClick={onClose}
            variant="ghost"
            size="medium"
            isLucid={true}
            data-cy="dependency-graph-close-button"
          />
        </div>
      </div>
      <div className="dependency-graph-canvas">
        <ReactFlowProvider>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            refitKey={refitKey}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            setHoveredNodeId={setHoveredNodeId}
          />
        </ReactFlowProvider>
      </div>
    </div>,
    document.body
  );
};

export default DependencyGraphOverlay;
