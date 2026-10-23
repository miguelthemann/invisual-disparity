import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Diagram, DiagramNode, DiagramEdge, DiagramType, NodeType, RelationshipType } from '../types';
import { SAMPLE_PROJECT } from '../utils/sampleData';

interface ProjectContextType {
  project: Project;
  activeDiagram: Diagram | undefined;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectingSource: { nodeId: string; anchor: 'top' | 'right' | 'bottom' | 'left' } | null;
  isSaving: boolean;
  activeRelType: RelationshipType;
  setActiveRelType: (rel: RelationshipType) => void;
  loadProject: (id?: string) => Promise<void>;
  saveProject: () => Promise<void>;
  createNewProject: (name: string, description: string) => Promise<void>;
  importProject: (data: Project) => Promise<void>;
  resetToSample: () => Promise<void>;
  setActiveDiagramId: (id: string) => void;
  addDiagram: (name: string, type: DiagramType, description?: string) => void;
  deleteDiagram: (id: string) => void;
  renameDiagram: (id: string, name: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setConnectingSource: (src: { nodeId: string; anchor: 'top' | 'right' | 'bottom' | 'left' } | null) => void;
  addNode: (type: NodeType, x: number, y: number, title?: string) => void;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (sourceId: string, targetId: string, type?: RelationshipType) => void;
  updateEdge: (id: string, updates: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;
  updateCanvasView: (zoom: number, pan: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project>(SAMPLE_PROJECT);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingSource, setConnectingSource] = useState<{ nodeId: string; anchor: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRelType, setActiveRelType] = useState<RelationshipType>('association');

  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active diagram helper
  const activeDiagram = project.diagrams.find(d => d.id === project.activeDiagramId) || project.diagrams[0];

  const pushHistory = (newProj: Project) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, JSON.parse(JSON.stringify(newProj))].slice(-25); // keep last 25 states
    });
    setHistoryIndex(prev => prev + 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setProject(JSON.parse(JSON.stringify(prev)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setProject(JSON.parse(JSON.stringify(next)));
    }
  };

  // Load project from backend API on mount
  const loadProject = useCallback(async (id?: string) => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const list = await res.json();
        if (list.length > 0) {
          const targetId = id || list[0].id;
          const projRes = await fetch(`/api/projects/${targetId}`);
          if (projRes.ok) {
            const data: Project = await projRes.json();
            setProject(data);
            setHistory([JSON.parse(JSON.stringify(data))]);
            setHistoryIndex(0);
            return;
          }
        }
      }
    } catch (e) {
      console.log('Using local state, could not reach API', e);
    }
    // Fallback to initial sample
    setProject(SAMPLE_PROJECT);
    setHistory([JSON.parse(JSON.stringify(SAMPLE_PROJECT))]);
    setHistoryIndex(0);
  }, []);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (project && project.id) {
        saveProject();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [project]);

  const saveProject = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  const createNewProject = async (name: string, description: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const newProj = await res.json();
        setProject(newProj);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        pushHistory(newProj);
      }
    } catch (e) {
      console.error('Failed to create project', e);
    }
  };

  const importProject = async (data: Project) => {
    try {
      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const imported = await res.json();
        setProject(imported);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        pushHistory(imported);
      }
    } catch (e) {
      console.error('Failed to import project', e);
    }
  };

  const resetToSample = async () => {
    try {
      const res = await fetch('/api/projects/reset-sample', { method: 'POST' });
      if (res.ok) {
        const sample = await res.json();
        setProject(sample);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        pushHistory(sample);
      }
    } catch (e) {
      setProject(SAMPLE_PROJECT);
    }
  };

  const setActiveDiagramId = (id: string) => {
    setProject(prev => ({ ...prev, activeDiagramId: id }));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const addDiagram = (name: string, type: DiagramType, description?: string) => {
    const newId = 'diag_' + Math.random().toString(36).substring(2, 9);
    const newDiagram: Diagram = {
      id: newId,
      name,
      type,
      description: description || '',
      nodes: [],
      edges: [],
      zoom: 1,
      pan: { x: 50, y: 50 },
    };

    setProject(prev => {
      const updated = {
        ...prev,
        activeDiagramId: newId,
        diagrams: [...prev.diagrams, newDiagram],
      };
      pushHistory(updated);
      return updated;
    });
  };

  const deleteDiagram = (id: string) => {
    if (project.diagrams.length <= 1) return;
    setProject(prev => {
      const newDiagrams = prev.diagrams.filter(d => d.id !== id);
      const nextActiveId = prev.activeDiagramId === id ? newDiagrams[0].id : prev.activeDiagramId;
      const updated = {
        ...prev,
        activeDiagramId: nextActiveId,
        diagrams: newDiagrams,
      };
      pushHistory(updated);
      return updated;
    });
  };

  const renameDiagram = (id: string, name: string) => {
    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d => (d.id === id ? { ...d, name } : d)),
      };
      pushHistory(updated);
      return updated;
    });
  };

  const selectNode = (id: string | null) => {
    setSelectedNodeId(id);
    if (id) setSelectedEdgeId(null);
  };

  const selectEdge = (id: string | null) => {
    setSelectedEdgeId(id);
    if (id) setSelectedNodeId(null);
  };

  const addNode = (type: NodeType, x: number, y: number, customTitle?: string) => {
    if (!activeDiagram) return;

    const id = 'node_' + Math.random().toString(36).substring(2, 9);
    let title = customTitle || 'NewElement';
    let width = 220;
    let height = 180;
    let colorTheme: any = 'blue';
    let attributes: any[] = [];
    let methods: any[] = [];
    let columns: any[] = [];
    let stereotype: string | undefined = undefined;
    let lifelineHeight: number | undefined = undefined;

    switch (type) {
      case 'uml_class':
        title = customTitle || 'NewClass';
        colorTheme = 'blue';
        attributes = [
          { id: 'a1', name: 'id', type: 'UUID', visibility: '+' },
          { id: 'a2', name: 'name', type: 'string', visibility: '+' },
        ];
        methods = [
          { id: 'm1', name: 'execute', parameters: '', returnType: 'void', visibility: '+' },
        ];
        break;
      case 'uml_interface':
        title = customTitle || 'INewService';
        stereotype = 'interface';
        colorTheme = 'amber';
        methods = [
          { id: 'm1', name: 'process', parameters: 'data: any', returnType: 'boolean', visibility: '+' },
        ];
        break;
      case 'uml_enum':
        title = customTitle || 'NewEnum';
        stereotype = 'enum';
        colorTheme = 'slate';
        height = 130;
        attributes = [
          { id: 'e1', name: 'ACTIVE', type: '', visibility: '+' },
          { id: 'e2', name: 'INACTIVE', type: '', visibility: '+' },
        ];
        break;
      case 'erd_table':
        title = customTitle || 'new_table';
        colorTheme = 'emerald';
        columns = [
          { id: 'c1', name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false },
          { id: 'c2', name: 'name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false },
          { id: 'c3', name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ];
        break;
      case 'usecase_actor':
        title = customTitle || 'Actor';
        width = 90;
        height = 110;
        colorTheme = 'blue';
        break;
      case 'usecase_bubble':
        title = customTitle || 'Perform Action';
        width = 190;
        height = 65;
        colorTheme = 'emerald';
        break;
      case 'usecase_boundary':
        title = customTitle || 'System Boundary';
        width = 500;
        height = 400;
        colorTheme = 'slate';
        break;
      case 'seq_lifeline':
        title = customTitle || 'Participant';
        width = 140;
        height = 55;
        lifelineHeight = 440;
        colorTheme = 'purple';
        break;
      case 'activity_start':
        title = 'Start';
        width = 40;
        height = 40;
        colorTheme = 'emerald';
        break;
      case 'activity_action':
        title = customTitle || 'Process Task';
        width = 160;
        height = 60;
        colorTheme = 'blue';
        break;
      case 'activity_decision':
        title = customTitle || 'Is Valid?';
        width = 80;
        height = 80;
        colorTheme = 'amber';
        break;
      case 'activity_end':
        title = 'End';
        width = 40;
        height = 40;
        colorTheme = 'rose';
        break;
      case 'note':
        title = 'Note';
        width = 200;
        height = 120;
        colorTheme = 'amber';
        break;
      case 'package':
        title = 'Package';
        width = 300;
        height = 200;
        colorTheme = 'slate';
        break;
    }

    const newNode: DiagramNode = {
      id,
      type,
      x,
      y,
      width,
      height,
      title,
      stereotype,
      colorTheme,
      attributes,
      methods,
      columns,
      lifelineHeight,
    };

    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d =>
          d.id === prev.activeDiagramId ? { ...d, nodes: [...d.nodes, newNode] } : d
        ),
      };
      pushHistory(updated);
      return updated;
    });

    setSelectedNodeId(id);
  };

  const updateNode = (id: string, updates: Partial<DiagramNode>) => {
    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d =>
          d.id === prev.activeDiagramId
            ? {
                ...d,
                nodes: d.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
              }
            : d
        ),
      };
      return updated;
    });
  };

  const deleteNode = (id: string) => {
    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d =>
          d.id === prev.activeDiagramId
            ? {
                ...d,
                nodes: d.nodes.filter(n => n.id !== id),
                edges: d.edges.filter(e => e.sourceId !== id && e.targetId !== id),
              }
            : d
        ),
      };
      pushHistory(updated);
      return updated;
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const addEdge = (sourceId: string, targetId: string, relType?: RelationshipType) => {
    if (!activeDiagram) return;

    const id = 'edge_' + Math.random().toString(36).substring(2, 9);
    let type = relType || activeRelType;

    // Smart default relationship based on diagram type
    if (!relType) {
      if (activeDiagram.type === 'erd') type = 'crows_foot_one_to_many';
      else if (activeDiagram.type === 'sequence') type = 'seq_sync_message';
      else if (activeDiagram.type === 'usecase') type = 'association';
      else type = 'association';
    }

    const newEdge: DiagramEdge = {
      id,
      sourceId,
      targetId,
      type,
      label: type === 'usecase_include' ? '<<include>>' : type === 'usecase_extend' ? '<<extend>>' : '',
      sourceMultiplicity: type === 'crows_foot_one_to_many' ? '1' : '',
      targetMultiplicity: type === 'crows_foot_one_to_many' ? '0..*' : '',
      sequenceOrder: activeDiagram.edges.filter(e => e.type.startsWith('seq_')).length,
    };

    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d =>
          d.id === prev.activeDiagramId ? { ...d, edges: [...d.edges, newEdge] } : d
        ),
      };
      pushHistory(updated);
      return updated;
    });

    setSelectedEdgeId(id);
  };

  const updateEdge = (id: string, updates: Partial<DiagramEdge>) => {
    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d =>
          d.id === prev.activeDiagramId
            ? {
                ...d,
                edges: d.edges.map(e => (e.id === id ? { ...e, ...updates } : e)),
              }
            : d
        ),
      };
      return updated;
    });
  };

  const deleteEdge = (id: string) => {
    setProject(prev => {
      const updated = {
        ...prev,
        diagrams: prev.diagrams.map(d =>
          d.id === prev.activeDiagramId
            ? {
                ...d,
                edges: d.edges.filter(e => e.id !== id),
              }
            : d
        ),
      };
      pushHistory(updated);
      return updated;
    });
    if (selectedEdgeId === id) setSelectedEdgeId(null);
  };

  const updateCanvasView = (zoom: number, pan: { x: number; y: number }) => {
    setProject(prev => ({
      ...prev,
      diagrams: prev.diagrams.map(d =>
        d.id === prev.activeDiagramId ? { ...d, zoom, pan } : d
      ),
    }));
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        activeDiagram,
        selectedNodeId,
        selectedEdgeId,
        connectingSource,
        isSaving,
        activeRelType,
        setActiveRelType,
        loadProject,
        saveProject,
        createNewProject,
        importProject,
        resetToSample,
        setActiveDiagramId,
        addDiagram,
        deleteDiagram,
        renameDiagram,
        selectNode,
        selectEdge,
        setConnectingSource,
        addNode,
        updateNode,
        deleteNode,
        addEdge,
        updateEdge,
        deleteEdge,
        updateCanvasView,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
};
