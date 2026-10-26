import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { DiagramType } from '../types';
import { 
  FolderTree, 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  Database, 
  FileCode, 
  Circle, 
  User, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Boxes,
  Workflow
} from './Icons';

interface SidebarProps {
  onOpenNewDiagramModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewDiagramModal }) => {
  const {
    project,
    activeDiagram,
    setActiveDiagramId,
    deleteDiagram,
    renameDiagram,
    selectNode,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'diagrams' | 'dictionary'>('diagrams');
  const [collapsed, setCollapsed] = useState(false);
  const [editingDiagId, setEditingDiagId] = useState<string | null>(null);
  const [editingDiagName, setEditingDiagName] = useState('');

  const getDiagramIcon = (type: DiagramType) => {
    switch (type) {
      case 'class':
        return <FileCode className="w-4 h-4 text-sky-400" />;
      case 'erd':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'sequence':
        return <Workflow className="w-4 h-4 text-purple-400" />;
      case 'usecase':
        return <User className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDiagId(id);
    setEditingDiagName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingDiagName.trim()) {
      renameDiagram(id, editingDiagName.trim());
    }
    setEditingDiagId(null);
  };

  if (collapsed) {
    return (
      <div className="h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 space-y-4 w-12 z-10 transition-all">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="border-t border-slate-800 w-full" />
        <button
          onClick={() => { setCollapsed(false); setActiveTab('diagrams'); }}
          className={`p-1.5 rounded ${activeTab === 'diagrams' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'}`}
          title="Diagrams"
        >
          <FolderTree className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setCollapsed(false); setActiveTab('dictionary'); }}
          className={`p-1.5 rounded ${activeTab === 'dictionary' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'}`}
          title="Model Dictionary"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Model Dictionary aggregates all elements across diagrams
  const allElements = project.diagrams.flatMap(d =>
    d.nodes.map(n => ({
      ...n,
      diagramId: d.id,
      diagramName: d.name,
    }))
  );

  return (
    <div className="h-full bg-slate-900 border-r border-slate-800 flex flex-col w-72 z-10 select-none shadow-xl">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <Boxes className="w-5 h-5 text-sky-400 shrink-0" />
          <div className="truncate">
            <h2 className="font-bold text-sm text-slate-100 truncate">{project.name}</h2>
            <p className="text-[10px] text-slate-400 truncate">Architecture & Modeling Suite</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('diagrams')}
          className={`py-2 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'diagrams'
              ? 'border-sky-500 text-sky-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Diagrams ({project.diagrams.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`py-2 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'dictionary'
              ? 'border-sky-500 text-sky-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Dictionary ({allElements.length})</span>
        </button>
      </div>

      {/* Tab 1: Diagrams Explorer */}
      {activeTab === 'diagrams' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 flex items-center justify-between border-b border-slate-800/60">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-1">
              Project Structure
            </span>
            <button
              onClick={onOpenNewDiagramModal}
              className="flex items-center space-x-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium shadow transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New Diagram</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {project.diagrams.map(diag => {
              const isActive = diag.id === project.activeDiagramId;
              const isEditing = editingDiagId === diag.id;

              return (
                <div
                  key={diag.id}
                  onClick={() => setActiveDiagramId(diag.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-sky-500/15 border border-sky-500/30 text-sky-200'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate flex-1">
                    {getDiagramIcon(diag.type)}
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingDiagName}
                        onChange={e => setEditingDiagName(e.target.value)}
                        onBlur={() => handleSaveRename(diag.id)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveRename(diag.id)}
                        className="bg-slate-950 px-1 py-0.5 rounded text-xs text-white border border-sky-500 flex-1"
                      />
                    ) : (
                      <span className="truncate">{diag.name}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => handleStartRename(diag.id, diag.name, e)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {project.diagrams.length > 1 && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            deleteDiagram(diag.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Model Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 py-1">
            All Model Elements
          </div>
          {allElements.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No elements created yet</div>
          ) : (
            allElements.map(el => (
              <div
                key={`${el.diagramId}_${el.id}`}
                onClick={() => {
                  setActiveDiagramId(el.diagramId);
                  selectNode(el.id);
                }}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 text-xs cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{el.title}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {el.type.replace('uml_', '').replace('erd_', '')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  In diagram: {el.diagramName}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <span>Docker / Self-Hosted</span>
        <span className="font-mono text-emerald-400 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
          Ready
        </span>
      </div>
    </div>
  );
};
