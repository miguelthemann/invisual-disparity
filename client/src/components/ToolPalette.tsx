import React from 'react';
import { useProject } from '../context/ProjectContext';
import { NodeType, RelationshipType } from '../types';
import { 
  Square, 
  Circle, 
  Database, 
  User, 
  Layers, 
  StickyNote, 
  ArrowRight, 
  GitMerge, 
  GitCommit, 
  Boxes, 
  Link2, 
  HelpCircle,
  Diamond,
  Spline,
  Share2
} from 'lucide-react';

export const ToolPalette: React.FC = () => {
  const { activeDiagram, addNode, activeRelType, setActiveRelType } = useProject();

  if (!activeDiagram) return null;

  const handleAdd = (type: NodeType, title?: string) => {
    // Add near center of current view
    const pan = activeDiagram.pan;
    const zoom = activeDiagram.zoom;
    const x = (-pan.x + 350) / zoom;
    const y = (-pan.y + 200) / zoom;
    addNode(type, Math.round(x / 10) * 10, Math.round(y / 10) * 10, title);
  };

  return (
    <div className="absolute top-16 left-6 z-20 flex flex-col space-y-4 pointer-events-auto">
      {/* Element Creation Palette */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-2.5 flex flex-col space-y-2 w-48">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 pb-1 border-b border-slate-800/80 flex items-center justify-between">
          <span>{activeDiagram.type.toUpperCase()} Elements</span>
          <Boxes className="w-3.5 h-3.5 text-sky-400" />
        </div>

        {/* Dynamic Buttons based on Diagram Type */}
        <div className="flex flex-col space-y-1">
          {activeDiagram.type === 'class' && (
            <>
              <button
                onClick={() => handleAdd('uml_class', 'NewClass')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <div className="w-3.5 h-3.5 rounded-sm border border-sky-400 bg-sky-950 flex items-center justify-center text-[9px] font-bold text-sky-400">C</div>
                <span>Class</span>
              </button>
              <button
                onClick={() => handleAdd('uml_interface', 'INewInterface')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <div className="w-3.5 h-3.5 rounded-sm border border-amber-400 bg-amber-950 flex items-center justify-center text-[9px] font-bold text-amber-400">I</div>
                <span>Interface</span>
              </button>
              <button
                onClick={() => handleAdd('uml_enum', 'NewEnum')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <div className="w-3.5 h-3.5 rounded-sm border border-slate-400 bg-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-400">E</div>
                <span>Enum</span>
              </button>
            </>
          )}

          {activeDiagram.type === 'erd' && (
            <>
              <button
                onClick={() => handleAdd('erd_table', 'new_table')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>ERD Table</span>
              </button>
            </>
          )}

          {activeDiagram.type === 'sequence' && (
            <>
              <button
                onClick={() => handleAdd('seq_lifeline', 'Participant')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Lifeline Box</span>
              </button>
            </>
          )}

          {activeDiagram.type === 'usecase' && (
            <>
              <button
                onClick={() => handleAdd('usecase_actor', 'User Actor')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Actor</span>
              </button>
              <button
                onClick={() => handleAdd('usecase_bubble', 'Use Case Action')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Use Case</span>
              </button>
              <button
                onClick={() => handleAdd('usecase_boundary', 'System Boundary')}
                className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>System Boundary</span>
              </button>
            </>
          )}

          {/* Common General elements */}
          <button
            onClick={() => handleAdd('note', 'Note')}
            className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-400" />
            <span>Design Note</span>
          </button>
        </div>
      </div>

      {/* Relationship Selector */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-2.5 flex flex-col space-y-2 w-48">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 pb-1 border-b border-slate-800/80 flex items-center justify-between">
          <span>Connector Type</span>
          <Share2 className="w-3.5 h-3.5 text-sky-400" />
        </div>

        <div className="flex flex-col space-y-1">
          {activeDiagram.type === 'class' && (
            <>
              <RelButton
                active={activeRelType === 'association'}
                onClick={() => setActiveRelType('association')}
                label="Association"
                symbol="───"
              />
              <RelButton
                active={activeRelType === 'generalization'}
                onClick={() => setActiveRelType('generalization')}
                label="Generalization (▲)"
                symbol="──▷"
              />
              <RelButton
                active={activeRelType === 'realization'}
                onClick={() => setActiveRelType('realization')}
                label="Realization"
                symbol="- -▷"
              />
              <RelButton
                active={activeRelType === 'composition'}
                onClick={() => setActiveRelType('composition')}
                label="Composition (◆)"
                symbol="◆──"
              />
              <RelButton
                active={activeRelType === 'aggregation'}
                onClick={() => setActiveRelType('aggregation')}
                label="Aggregation (◇)"
                symbol="◇──"
              />
              <RelButton
                active={activeRelType === 'dependency'}
                onClick={() => setActiveRelType('dependency')}
                label="Dependency"
                symbol="- - >"
              />
            </>
          )}

          {activeDiagram.type === 'erd' && (
            <>
              <RelButton
                active={activeRelType === 'crows_foot_one_to_many'}
                onClick={() => setActiveRelType('crows_foot_one_to_many')}
                label="1 to Many (1 : N)"
                symbol="||──o{"
              />
              <RelButton
                active={activeRelType === 'crows_foot_one_to_one'}
                onClick={() => setActiveRelType('crows_foot_one_to_one')}
                label="1 to 1 (1 : 1)"
                symbol="||──||"
              />
              <RelButton
                active={activeRelType === 'crows_foot_many_to_many'}
                onClick={() => setActiveRelType('crows_foot_many_to_many')}
                label="Many to Many (N : M)"
                symbol="}o──o{"
              />
            </>
          )}

          {activeDiagram.type === 'sequence' && (
            <>
              <RelButton
                active={activeRelType === 'seq_sync_message'}
                onClick={() => setActiveRelType('seq_sync_message')}
                label="Sync Call (──▶)"
                symbol="──▶"
              />
              <RelButton
                active={activeRelType === 'seq_async_message'}
                onClick={() => setActiveRelType('seq_async_message')}
                label="Async Call (──>)"
                symbol="──>"
              />
              <RelButton
                active={activeRelType === 'seq_return_message'}
                onClick={() => setActiveRelType('seq_return_message')}
                label="Return Call (- ->)"
                symbol="- - >"
              />
            </>
          )}

          {activeDiagram.type === 'usecase' && (
            <>
              <RelButton
                active={activeRelType === 'association'}
                onClick={() => setActiveRelType('association')}
                label="Association"
                symbol="───"
              />
              <RelButton
                active={activeRelType === 'usecase_include'}
                onClick={() => setActiveRelType('usecase_include')}
                label="<<include>>"
                symbol="- - >"
              />
              <RelButton
                active={activeRelType === 'usecase_extend'}
                onClick={() => setActiveRelType('usecase_extend')}
                label="<<extend>>"
                symbol="- - >"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface RelButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  symbol: string;
}

const RelButton: React.FC<RelButtonProps> = ({ active, onClick, label, symbol }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition-colors ${
      active
        ? 'bg-sky-600 text-white font-semibold'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="truncate">{label}</span>
    <span className="font-mono text-[10px] opacity-80 ml-1">{symbol}</span>
  </button>
);
