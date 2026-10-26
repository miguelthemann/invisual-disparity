import React from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  Code2, 
  Database, 
  Download, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2, 
  Loader2, 
  FilePlus, 
  Upload, 
  RefreshCw,
  FolderOpen,
  Boxes
} from 'lucide-react';

interface NavbarProps {
  onOpenDDLModal: () => void;
  onOpenCodeModal: () => void;
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDDLModal,
  onOpenCodeModal,
  onOpenExportModal,
}) => {
  const {
    project,
    activeDiagram,
    isSaving,
    undo,
    redo,
    canUndo,
    canRedo,
    updateCanvasView,
    resetToSample,
    importProject,
    createNewProject,
  } = useProject();

  const handleZoom = (delta: number) => {
    if (!activeDiagram) return;
    const current = activeDiagram.zoom;
    const next = Math.min(Math.max(current + delta, 0.2), 3);
    updateCanvasView(next, activeDiagram.pan);
  };

  const handleResetZoom = () => {
    if (!activeDiagram) return;
    updateCanvasView(1, { x: 50, y: 50 });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          importProject(parsed);
        } catch (err) {
          alert('Invalid project JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30 select-none shadow-md">
      {/* Left: Brand & Active Diagram */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center space-x-1.5">
              <span>Invisual Disparity</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/40">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {activeDiagram?.name || 'Modeling Canvas'}
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Diagram Type Badge */}
        {activeDiagram && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
            {activeDiagram.type.toUpperCase()}
          </span>
        )}

        {/* Autosave Status */}
        <div className="flex items-center space-x-1 text-xs text-slate-400">
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span className="text-[11px] text-slate-400">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Canvas View Controls (Undo, Redo, Zoom) */}
      <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <button
          onClick={() => handleZoom(0.1)}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Engineering & Code Generation Tools */}
      <div className="flex items-center space-x-2">
        {/* DDL SQL Generation Button (Always enabled or highlights on ERD) */}
        <button
          onClick={onOpenDDLModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold shadow transition-colors"
          title="Generate SQL DDL for PostgreSQL, MySQL, SQLite, Oracle"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Generate DDL</span>
        </button>

        {/* Code Generation Button (TypeScript, Python, Java, Go, C#) */}
        <button
          onClick={onOpenCodeModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600/15 hover:bg-sky-600/25 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold shadow transition-colors"
          title="Generate TypeScript, Python, Java, Go, C# Code"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Generate Code</span>
        </button>

        {/* Export Modal Button (PNG, SVG, Mermaid, PlantUML) */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          title="Export Diagram & Documentation"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Quick project tools */}
        <label className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors" title="Import Project JSON">
          <Upload className="w-4 h-4" />
          <input
            type="file"
            accept=".json,.invisual"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        <button
          onClick={resetToSample}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset to Starter Sample Project"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
