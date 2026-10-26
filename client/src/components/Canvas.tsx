import React, { useRef, useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { DiagramNode, DiagramEdge, RelationshipType } from '../types';
import { calculateEdgePath } from '../utils/connectorRouting';
import { 
  Key, 
  Layers, 
  Plus, 
  Trash2, 
  Move, 
  User, 
  Database, 
  FileCode, 
  Maximize2 
} from './Icons';

export const Canvas: React.FC = () => {
  const {
    activeDiagram,
    selectedNodeId,
    selectedEdgeId,
    selectNode,
    selectEdge,
    updateNode,
    addEdge,
    deleteNode,
    deleteEdge,
    updateCanvasView,
    activeRelType,
  } = useProject();

  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const zoom = activeDiagram?.zoom ?? 1;
  const pan = activeDiagram?.pan ?? { x: 50, y: 50 };

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (e.code === 'Space' && tag !== 'input' && tag !== 'textarea') {
        setIsSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection dragging state
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    anchor: 'top' | 'right' | 'bottom' | 'left';
    x: number;
    y: number;
  } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });

  if (!activeDiagram) {
    return <div className="flex-1 flex items-center justify-center text-slate-500">No active diagram</div>;
  }

  // Handle Zoom via mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    newZoom = Math.min(Math.max(newZoom, 0.2), 3); // limit 20% to 300%

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      updateCanvasView(newZoom, { x: newPanX, y: newPanY });
    }
  };

  // Global drag release listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingNodeId(null);
      setIsPanning(false);
      setConnectionStart(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('pointerup', handleGlobalMouseUp);
    window.addEventListener('blur', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('pointerup', handleGlobalMouseUp);
      window.removeEventListener('blur', handleGlobalMouseUp);
    };
  }, []);

  // Handle Pan Start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background or middle click or space pressed
    if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-svg' || e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      selectNode(null);
      selectEdge(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // If no mouse button is held, guarantee release of all drag states
    if (e.buttons === 0) {
      if (draggingNodeId) setDraggingNodeId(null);
      if (isPanning) setIsPanning(false);
      if (connectionStart) setConnectionStart(null);
      return;
    }

    if (isPanning) {
      updateCanvasView(zoom, {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingNodeId) {
      const node = activeDiagram.nodes.find(n => n.id === draggingNodeId);
      if (node && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - pan.x) / zoom;
        const canvasY = (e.clientY - rect.top - pan.y) / zoom;

        // Snap to 10px grid
        const snappedX = Math.round((canvasX - dragOffset.x) / 10) * 10;
        const snappedY = Math.round((canvasY - dragOffset.y) / 10) * 10;

        updateNode(draggingNodeId, { x: snappedX, y: snappedY });
      }
      return;
    }

    if (connectionStart && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCurrentMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectionStart(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    e.stopPropagation();
    selectNode(node.id);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;

      setDraggingNodeId(node.id);
      setDragOffset({
        x: mouseCanvasX - node.x,
        y: mouseCanvasY - node.y,
      });
    }
  };

  // Connection Port Start
  const handlePortMouseDown = (
    e: React.MouseEvent,
    node: DiagramNode,
    anchor: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    e.stopPropagation();
    let portX = node.x + node.width / 2;
    let portY = node.y + node.height / 2;

    if (anchor === 'top') portY = node.y;
    if (anchor === 'bottom') portY = node.y + node.height;
    if (anchor === 'left') portX = node.x;
    if (anchor === 'right') portX = node.x + node.width;

    setConnectionStart({
      nodeId: node.id,
      anchor,
      x: portX,
      y: portY,
    });
    setCurrentMousePos({ x: portX, y: portY });
  };

  // Connection Port Drop on Target Node
  const handleNodeMouseUp = (e: React.MouseEvent, targetNode: DiagramNode) => {
    e.stopPropagation();
    if (connectionStart && connectionStart.nodeId !== targetNode.id) {
      addEdge(connectionStart.nodeId, targetNode.id, activeRelType);
    }
    setConnectionStart(null);
    setDraggingNodeId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-slate-950 canvas-grid-dots cursor-crosshair select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Zoom / Pan indicator badge */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono shadow-lg pointer-events-none">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>•</span>
        <span>X: {Math.round(pan.x)} Y: {Math.round(pan.y)}</span>
      </div>

      {/* Transformed Stage */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG Layer for Connectors, Markers & Temporary Connection */}
        <svg
          id="canvas-svg"
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            {/* Open Arrow (Dependency, Directed Association) */}
            <marker
              id="marker-arrow-open"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            </marker>

            {/* Filled Arrow (Sequence Synchronous Call) */}
            <marker
              id="marker-arrow-filled"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
            </marker>

            {/* Dashed Return Arrow */}
            <marker
              id="marker-arrow-open-dashed"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            </marker>

            {/* Hollow Triangle (UML Generalization / Realization) */}
            <marker
              id="marker-triangle-hollow"
              viewBox="0 0 14 14"
              refX="14"
              refY="7"
              markerWidth="12"
              markerHeight="12"
              orient="auto-start-reverse"
            >
              <polygon points="0,0 14,7 0,14" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            </marker>

            {/* Hollow Diamond (UML Aggregation) */}
            <marker
              id="marker-diamond-hollow"
              viewBox="0 0 16 10"
              refX="0"
              refY="5"
              markerWidth="14"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <polygon points="8,0 16,5 8,10 0,5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            </marker>

            {/* Filled Diamond (UML Composition) */}
            <marker
              id="marker-diamond-filled"
              viewBox="0 0 16 10"
              refX="0"
              refY="5"
              markerWidth="14"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <polygon points="8,0 16,5 8,10 0,5" fill="#94a3b8" stroke="#94a3b8" strokeWidth="1.5" />
            </marker>

            {/* Crow's Foot: One (Double Crossbar) */}
            <marker
              id="marker-crows-foot-one"
              viewBox="0 0 16 16"
              refX="16"
              refY="8"
              markerWidth="12"
              markerHeight="12"
              orient="auto-start-reverse"
            >
              <line x1="6" y1="2" x2="6" y2="14" stroke="#38bdf8" strokeWidth="2" />
              <line x1="12" y1="2" x2="12" y2="14" stroke="#38bdf8" strokeWidth="2" />
            </marker>

            {/* Crow's Foot: Many (Fork with Zero circle) */}
            <marker
              id="marker-crows-foot-many"
              viewBox="0 0 20 16"
              refX="20"
              refY="8"
              markerWidth="16"
              markerHeight="14"
              orient="auto-start-reverse"
            >
              {/* Optional circle */}
              <circle cx="5" cy="8" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              {/* Crow's fork */}
              <path d="M 10 2 L 20 8 L 10 14 M 10 8 L 20 8" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            </marker>

            <marker
              id="marker-crows-foot-one-start"
              viewBox="0 0 16 16"
              refX="0"
              refY="8"
              markerWidth="12"
              markerHeight="12"
              orient="auto-start-reverse"
            >
              <line x1="4" y1="2" x2="4" y2="14" stroke="#38bdf8" strokeWidth="2" />
              <line x1="10" y1="2" x2="10" y2="14" stroke="#38bdf8" strokeWidth="2" />
            </marker>
          </defs>

          {/* Render Existing Edges */}
          {activeDiagram.edges.map(edge => {
            const srcNode = activeDiagram.nodes.find(n => n.id === edge.sourceId);
            const tgtNode = activeDiagram.nodes.find(n => n.id === edge.targetId);
            if (!srcNode || !tgtNode) return null;

            const pathInfo = calculateEdgePath(edge, srcNode, tgtNode, activeDiagram.edges);
            const isSelected = selectedEdgeId === edge.id;

            return (
              <g
                key={edge.id}
                className="pointer-events-auto cursor-pointer group"
                onClick={e => {
                  e.stopPropagation();
                  selectEdge(edge.id);
                }}
              >
                {/* Thick invisible hit area for easy clicking */}
                <path
                  d={pathInfo.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Visible Connector Line */}
                <path
                  d={pathInfo.path}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : '#64748b'}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                  strokeDasharray={pathInfo.strokeDasharray}
                  markerEnd={pathInfo.markerEnd}
                  markerStart={pathInfo.markerStart}
                  className="transition-colors group-hover:stroke-sky-400"
                />

                {/* Edge Label */}
                {edge.label && (
                  <g transform={`translate(${pathInfo.midPoint.x}, ${pathInfo.midPoint.y})`}>
                    <rect
                      x={- (edge.label.length * 4 + 10)}
                      y="-12"
                      width={edge.label.length * 8 + 20}
                      height="20"
                      rx="4"
                      className="fill-slate-900/90 stroke-slate-800"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      className="text-[11px] fill-slate-300 font-sans font-medium"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}

                {/* Source & Target Multiplicities */}
                {edge.sourceMultiplicity && (
                  <text
                    x={pathInfo.sourcePoint.x + 10}
                    y={pathInfo.sourcePoint.y - 8}
                    className="text-[10px] fill-sky-400 font-mono font-semibold select-none"
                  >
                    {edge.sourceMultiplicity}
                  </text>
                )}
                {edge.targetMultiplicity && (
                  <text
                    x={pathInfo.targetPoint.x - 20}
                    y={pathInfo.targetPoint.y - 8}
                    className="text-[10px] fill-sky-400 font-mono font-semibold select-none"
                  >
                    {edge.targetMultiplicity}
                  </text>
                )}
              </g>
            );
          })}

          {/* Temporary Connection line when dragging from a port */}
          {connectionStart && (
            <path
              d={`M ${connectionStart.x} ${connectionStart.y} L ${currentMousePos.x} ${currentMousePos.y}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4,4"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* HTML Layer: High Fidelity Nodes */}
        {activeDiagram.nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          return (
            <NodeElement
              key={node.id}
              node={node}
              isSelected={isSelected}
              onMouseDown={e => handleNodeMouseDown(e, node)}
              onMouseUp={e => handleNodeMouseUp(e, node)}
              onPortMouseDown={(e, anchor) => handlePortMouseDown(e, node, anchor)}
            />
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// Specialized Node Element Component
// =========================================================================
interface NodeElementProps {
  node: DiagramNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onPortMouseDown: (e: React.MouseEvent, anchor: 'top' | 'right' | 'bottom' | 'left') => void;
}

const NodeElement: React.FC<NodeElementProps> = ({
  node,
  isSelected,
  onMouseDown,
  onMouseUp,
  onPortMouseDown,
}) => {
  const getThemeClasses = () => {
    switch (node.colorTheme) {
      case 'blue':
        return {
          border: isSelected ? 'border-sky-400 ring-2 ring-sky-500/30' : 'border-sky-700/60 hover:border-sky-500',
          header: 'bg-sky-950/80 text-sky-200 border-sky-800/80',
          badge: 'bg-sky-500/20 text-sky-300',
        };
      case 'emerald':
        return {
          border: isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-emerald-700/60 hover:border-emerald-500',
          header: 'bg-emerald-950/80 text-emerald-200 border-emerald-800/80',
          badge: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'purple':
        return {
          border: isSelected ? 'border-purple-400 ring-2 ring-purple-500/30' : 'border-purple-700/60 hover:border-purple-500',
          header: 'bg-purple-950/80 text-purple-200 border-purple-800/80',
          badge: 'bg-purple-500/20 text-purple-300',
        };
      case 'amber':
        return {
          border: isSelected ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-700/60 hover:border-amber-500',
          header: 'bg-amber-950/80 text-amber-200 border-amber-800/80',
          badge: 'bg-amber-500/20 text-amber-300',
        };
      case 'rose':
        return {
          border: isSelected ? 'border-rose-400 ring-2 ring-rose-500/30' : 'border-rose-700/60 hover:border-rose-500',
          header: 'bg-rose-950/80 text-rose-200 border-rose-800/80',
          badge: 'bg-rose-500/20 text-rose-300',
        };
      default:
        return {
          border: isSelected ? 'border-slate-300 ring-2 ring-slate-400/30' : 'border-slate-700 hover:border-slate-500',
          header: 'bg-slate-900 text-slate-200 border-slate-800',
          badge: 'bg-slate-700/50 text-slate-300',
        };
    }
  };

  const theme = getThemeClasses();

  // Ports to drag connections from
  const renderPorts = () => (
    <>
      <div
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-sky-400 rounded-full border border-slate-950 shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair z-30"
        onMouseDown={e => onPortMouseDown(e, 'top')}
        title="Connect from Top"
      />
      <div
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-sky-400 rounded-full border border-slate-950 shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair z-30"
        onMouseDown={e => onPortMouseDown(e, 'bottom')}
        title="Connect from Bottom"
      />
      <div
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-sky-400 rounded-full border border-slate-950 shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair z-30"
        onMouseDown={e => onPortMouseDown(e, 'left')}
        title="Connect from Left"
      />
      <div
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-sky-400 rounded-full border border-slate-950 shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair z-30"
        onMouseDown={e => onPortMouseDown(e, 'right')}
        title="Connect from Right"
      />
    </>
  );

  // 1. UML CLASS & INTERFACE NODE
  if (node.type === 'uml_class' || node.type === 'uml_interface' || node.type === 'uml_enum') {
    const isInterface = node.type === 'uml_interface' || node.stereotype === 'interface';
    const isEnum = node.type === 'uml_enum' || node.stereotype === 'enum';

    return (
      <div
        className={`absolute rounded-md shadow-xl bg-slate-900/95 backdrop-blur-md border ${theme.border} pointer-events-auto cursor-move group transition-shadow`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          minHeight: `${node.height}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {renderPorts()}

        {/* Header Compartment */}
        <div className={`p-2.5 border-b rounded-t-[5px] text-center ${theme.header}`}>
          {(node.stereotype || isInterface || isEnum) && (
            <div className="text-[10px] tracking-wider uppercase font-mono opacity-70">
              «{node.stereotype || (isInterface ? 'interface' : 'enum')}»
            </div>
          )}
          <div className="font-semibold text-sm tracking-tight">{node.title}</div>
        </div>

        {/* Attributes Compartment */}
        {!isEnum && (
          <div className="p-2 border-b border-slate-800/80 font-mono text-[11px] space-y-1 text-slate-300">
            {(node.attributes || []).length === 0 ? (
              <div className="text-[10px] italic text-slate-500">No attributes</div>
            ) : (
              (node.attributes || []).map(attr => (
                <div key={attr.id} className="flex items-center space-x-1.5 truncate">
                  <span className={`font-bold w-2 text-center ${
                    attr.visibility === '+' ? 'text-emerald-400' :
                    attr.visibility === '-' ? 'text-rose-400' :
                    attr.visibility === '#' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {attr.visibility}
                  </span>
                  <span className="font-medium text-slate-200">{attr.name}</span>
                  <span className="text-slate-500">:</span>
                  <span className="text-sky-400">{attr.type}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Enum Literals Compartment */}
        {isEnum && (
          <div className="p-2 border-b border-slate-800/80 font-mono text-[11px] space-y-1 text-slate-300">
            {(node.attributes || []).map(attr => (
              <div key={attr.id} className="text-slate-300 font-medium tracking-wide">
                {attr.name}
              </div>
            ))}
          </div>
        )}

        {/* Operations / Methods Compartment */}
        {!isEnum && (
          <div className="p-2 font-mono text-[11px] space-y-1 text-slate-300">
            {(node.methods || []).length === 0 ? (
              <div className="text-[10px] italic text-slate-500">No methods</div>
            ) : (
              (node.methods || []).map(m => (
                <div key={m.id} className="flex items-center space-x-1 truncate">
                  <span className={`font-bold w-2 text-center ${
                    m.visibility === '+' ? 'text-emerald-400' :
                    m.visibility === '-' ? 'text-rose-400' :
                    m.visibility === '#' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {m.visibility}
                  </span>
                  <span className="font-medium text-slate-200">{m.name}</span>
                  <span className="text-slate-400">({m.parameters || ''})</span>
                  <span className="text-slate-500">:</span>
                  <span className="text-emerald-400">{m.returnType || 'void'}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. ERD TABLE NODE
  if (node.type === 'erd_table') {
    return (
      <div
        className={`absolute rounded-md shadow-xl bg-slate-900/95 backdrop-blur-md border ${theme.border} pointer-events-auto cursor-move group transition-shadow`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          minHeight: `${node.height}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {renderPorts()}

        {/* Table Header */}
        <div className={`p-2.5 border-b rounded-t-[5px] flex items-center justify-between ${theme.header}`}>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm tracking-tight">{node.title}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            Table
          </span>
        </div>

        {/* Columns Compartment */}
        <div className="p-2 space-y-1 font-mono text-[11px]">
          {(node.columns || []).map(col => (
            <div key={col.id} className="flex items-center justify-between text-slate-300 hover:text-white py-0.5 border-b border-slate-800/40 last:border-0">
              <div className="flex items-center space-x-1.5 truncate">
                {col.isPk ? (
                  <span className="flex items-center text-amber-400 text-[10px] font-bold" title="Primary Key">
                    <Key className="w-3 h-3 mr-0.5" />
                    PK
                  </span>
                ) : col.isFk ? (
                  <span className="text-sky-400 text-[10px] font-bold" title="Foreign Key">
                    FK
                  </span>
                ) : (
                  <span className="w-3" />
                )}
                <span className={`font-medium ${col.isPk ? 'text-amber-300 font-semibold' : 'text-slate-200'}`}>
                  {col.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                <span>{col.type}</span>
                {!col.isNullable && <span className="text-rose-400 text-[9px] font-bold">NN</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. SEQUENCE LIFELINE NODE
  if (node.type === 'seq_lifeline') {
    const lifelineH = node.lifelineHeight || 450;
    return (
      <div
        className="absolute pointer-events-auto cursor-move group"
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {/* Lifeline Header Box */}
        <div className={`p-2.5 rounded-md shadow-lg bg-slate-900 border ${theme.border} text-center flex flex-col items-center justify-center`}>
          {node.stereotype && (
            <div className="text-[10px] uppercase font-mono tracking-wider opacity-70">
              «{node.stereotype}»
            </div>
          )}
          <div className="font-semibold text-sm text-slate-100">{node.title}</div>
        </div>

        {/* Vertical Dashed Lifeline Line */}
        <div
          className="relative mx-auto border-l-2 border-dashed border-slate-600 pointer-events-none"
          style={{ height: `${lifelineH}px`, width: '1px' }}
        >
          {/* Activation Bar */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-10 w-3 bg-sky-500/30 border border-sky-400 rounded-sm"
            style={{ height: `${lifelineH - 60}px` }}
          />
        </div>

        {/* Bottom Box to close lifeline */}
        <div className="w-8 h-2 mx-auto bg-slate-800 rounded-sm border border-slate-700" />
      </div>
    );
  }

  // 4. USE CASE ACTOR NODE
  if (node.type === 'usecase_actor') {
    return (
      <div
        className={`absolute flex flex-col items-center justify-center p-2 rounded-lg cursor-move pointer-events-auto group ${
          isSelected ? 'ring-2 ring-sky-400' : ''
        }`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          height: `${node.height}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {renderPorts()}
        <div className="w-12 h-12 rounded-full bg-sky-950 border-2 border-sky-400 flex items-center justify-center shadow-lg group-hover:border-sky-300">
          <User className="w-6 h-6 text-sky-300" />
        </div>
        <div className="mt-2 text-xs font-semibold text-slate-200 text-center">{node.title}</div>
      </div>
    );
  }

  // 5. USE CASE BUBBLE NODE
  if (node.type === 'usecase_bubble') {
    return (
      <div
        className={`absolute rounded-[32px] px-4 py-3 flex items-center justify-center text-center shadow-lg bg-slate-900/90 backdrop-blur border ${theme.border} pointer-events-auto cursor-move group`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          height: `${node.height}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {renderPorts()}
        <span className="text-xs font-medium text-slate-100">{node.title}</span>
      </div>
    );
  }

  // 6. SYSTEM BOUNDARY NODE
  if (node.type === 'usecase_boundary') {
    return (
      <div
        className={`absolute rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 pointer-events-auto cursor-move group ${
          isSelected ? 'border-sky-400' : ''
        }`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          height: `${node.height}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <div className="p-3 font-semibold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
          {node.title}
        </div>
      </div>
    );
  }

  // 7. NOTE NODE
  if (node.type === 'note') {
    return (
      <div
        className={`absolute p-3 rounded-md shadow-xl bg-amber-500/10 border border-amber-500/40 backdrop-blur-sm pointer-events-auto cursor-move group ${
          isSelected ? 'ring-2 ring-amber-400' : ''
        }`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          minHeight: `${node.height}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {renderPorts()}
        <div className="font-semibold text-xs text-amber-300 border-b border-amber-500/20 pb-1 mb-1">
          {node.title}
        </div>
        <p className="text-[11px] text-amber-200/90 whitespace-pre-wrap leading-relaxed">
          {node.description || 'Add note description in Property Inspector'}
        </p>
      </div>
    );
  }

  // Fallback Generic Node
  return (
    <div
      className={`absolute p-3 rounded shadow-md bg-slate-900 border ${theme.border} pointer-events-auto cursor-move group`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {renderPorts()}
      <div className="font-semibold text-sm">{node.title}</div>
    </div>
  );
};
