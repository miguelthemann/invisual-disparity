import React, { useState, useEffect } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { ToolPalette } from './components/ToolPalette';
import { PropertyInspector } from './components/PropertyInspector';
import { DDLGenModal } from './components/DDLGenModal';
import { CodeGenModal } from './components/CodeGenModal';
import { ExportModal } from './components/ExportModal';
import { NewDiagramModal } from './components/NewDiagramModal';

const MainLayout: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    deleteNode,
    deleteEdge,
    selectNode,
    selectEdge,
    undo,
    redo,
    saveProject,
  } = useProject();

  const [isDDLModalOpen, setIsDDLModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewDiagramModalOpen, setIsNewDiagramModalOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused inside an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();
        return;
      }

      // Delete / Backspace: delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          e.preventDefault();
          deleteEdge(selectedEdgeId);
        }
        return;
      }

      // Escape: deselect
      if (e.key === 'Escape') {
        selectNode(null);
        selectEdge(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, undo, redo, deleteNode, deleteEdge, saveProject, selectNode, selectEdge]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onOpenDDLModal={() => setIsDDLModalOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Diagrams Navigator & Model Explorer) */}
        <Sidebar onOpenNewDiagramModal={() => setIsNewDiagramModalOpen(true)} />

        {/* Center Canvas Area with Tool Palette */}
        <div className="flex-1 relative h-full overflow-hidden flex">
          <ToolPalette />
          <Canvas />
          <PropertyInspector />
        </div>
      </div>

      {/* Modals */}
      <DDLGenModal
        isOpen={isDDLModalOpen}
        onClose={() => setIsDDLModalOpen(false)}
      />
      <CodeGenModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <NewDiagramModal
        isOpen={isNewDiagramModalOpen}
        onClose={() => setIsNewDiagramModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainLayout />
    </ProjectProvider>
  );
}
