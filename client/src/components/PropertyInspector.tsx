import React from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Key, 
  Layers, 
  Palette, 
  Type, 
  AlignLeft,
  ChevronRight,
  Database
} from 'lucide-react';

export const PropertyInspector: React.FC = () => {
  const {
    activeDiagram,
    selectedNodeId,
    selectedEdgeId,
    selectNode,
    selectEdge,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
  } = useProject();

  if (!activeDiagram) return null;

  const selectedNode = activeDiagram.nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = activeDiagram.edges.find(e => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  // ==========================================
  // Edge Inspector
  // ==========================================
  if (selectedEdge) {
    const srcNode = activeDiagram.nodes.find(n => n.id === selectedEdge.sourceId);
    const tgtNode = activeDiagram.nodes.find(n => n.id === selectedEdge.targetId);

    return (
      <div className="absolute top-16 right-6 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-4 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto pointer-events-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <h3 className="font-semibold text-sm text-slate-100">Relationship</h3>
          </div>
          <button
            onClick={() => selectEdge(null)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Source & Target</label>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300 font-mono text-[11px] truncate">
              {srcNode?.title || 'Unknown'} ➔ {tgtNode?.title || 'Unknown'}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Type</label>
            <select
              value={selectedEdge.type}
              onChange={e => updateEdge(selectedEdge.id, { type: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="association">Association</option>
              <option value="directed_association">Directed Association</option>
              <option value="generalization">Generalization / Inheritance</option>
              <option value="realization">Realization / Interface</option>
              <option value="composition">Composition</option>
              <option value="aggregation">Aggregation</option>
              <option value="dependency">Dependency</option>
              <option value="crows_foot_one_to_many">Crow's Foot 1 : N</option>
              <option value="crows_foot_one_to_one">Crow's Foot 1 : 1</option>
              <option value="crows_foot_many_to_many">Crow's Foot N : M</option>
              <option value="usecase_include">&lt;&lt;include&gt;&gt;</option>
              <option value="usecase_extend">&lt;&lt;extend&gt;&gt;</option>
              <option value="seq_sync_message">Sequence Sync Call</option>
              <option value="seq_async_message">Sequence Async Call</option>
              <option value="seq_return_message">Sequence Return Call</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Label</label>
            <input
              type="text"
              value={selectedEdge.label || ''}
              onChange={e => updateEdge(selectedEdge.id, { label: e.target.value })}
              placeholder="e.g. places, contains, <<include>>"
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Src Multiplicity</label>
              <input
                type="text"
                value={selectedEdge.sourceMultiplicity || ''}
                onChange={e => updateEdge(selectedEdge.id, { sourceMultiplicity: e.target.value })}
                placeholder="e.g. 1, 0..1"
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Tgt Multiplicity</label>
              <input
                type="text"
                value={selectedEdge.targetMultiplicity || ''}
                onChange={e => updateEdge(selectedEdge.id, { targetMultiplicity: e.target.value })}
                placeholder="e.g. 1..*, *"
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => deleteEdge(selectedEdge.id)}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Relationship</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Node Inspector
  // ==========================================
  if (!selectedNode) return null;

  const isUml = selectedNode.type === 'uml_class' || selectedNode.type === 'uml_interface' || selectedNode.type === 'uml_enum';
  const isErd = selectedNode.type === 'erd_table';

  // Attribute Handlers
  const handleAddAttribute = () => {
    const newAttr = {
      id: 'a_' + Math.random().toString(36).substring(2, 7),
      name: 'newField',
      type: 'string',
      visibility: '+' as const,
    };
    updateNode(selectedNode.id, {
      attributes: [...(selectedNode.attributes || []), newAttr],
    });
  };

  const handleUpdateAttribute = (id: string, updates: any) => {
    updateNode(selectedNode.id, {
      attributes: (selectedNode.attributes || []).map(a =>
        a.id === id ? { ...a, ...updates } : a
      ),
    });
  };

  const handleDeleteAttribute = (id: string) => {
    updateNode(selectedNode.id, {
      attributes: (selectedNode.attributes || []).filter(a => a.id !== id),
    });
  };

  // Method Handlers
  const handleAddMethod = () => {
    const newMethod = {
      id: 'm_' + Math.random().toString(36).substring(2, 7),
      name: 'newMethod',
      parameters: '',
      returnType: 'void',
      visibility: '+' as const,
    };
    updateNode(selectedNode.id, {
      methods: [...(selectedNode.methods || []), newMethod],
    });
  };

  const handleUpdateMethod = (id: string, updates: any) => {
    updateNode(selectedNode.id, {
      methods: (selectedNode.methods || []).map(m =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  };

  const handleDeleteMethod = (id: string) => {
    updateNode(selectedNode.id, {
      methods: (selectedNode.methods || []).filter(m => m.id !== id),
    });
  };

  // ERD Column Handlers
  const handleAddColumn = () => {
    const newCol = {
      id: 'c_' + Math.random().toString(36).substring(2, 7),
      name: 'column_name',
      type: 'VARCHAR(255)',
      isPk: false,
      isFk: false,
      isNullable: true,
    };
    updateNode(selectedNode.id, {
      columns: [...(selectedNode.columns || []), newCol],
    });
  };

  const handleUpdateColumn = (id: string, updates: any) => {
    updateNode(selectedNode.id, {
      columns: (selectedNode.columns || []).map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const handleDeleteColumn = (id: string) => {
    updateNode(selectedNode.id, {
      columns: (selectedNode.columns || []).filter(c => c.id !== id),
    });
  };

  return (
    <div className="absolute top-16 right-6 z-20 w-84 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-4 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto pointer-events-auto">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <h3 className="font-semibold text-sm text-slate-100">
            {isUml ? 'UML Element' : isErd ? 'Database Table' : 'Element Properties'}
          </h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Name / Title */}
        <div>
          <label className="text-slate-400 block mb-1">Name</label>
          <input
            type="text"
            value={selectedNode.title}
            onChange={e => updateNode(selectedNode.id, { title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Stereotype (UML) */}
        {isUml && (
          <div>
            <label className="text-slate-400 block mb-1">Stereotype</label>
            <input
              type="text"
              value={selectedNode.stereotype || ''}
              onChange={e => updateNode(selectedNode.id, { stereotype: e.target.value })}
              placeholder="e.g. interface, entity, service, aggregate"
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-sky-500"
            />
          </div>
        )}

        {/* Description / Documentation */}
        <div>
          <label className="text-slate-400 block mb-1">Documentation</label>
          <textarea
            rows={2}
            value={selectedNode.description || ''}
            onChange={e => updateNode(selectedNode.id, { description: e.target.value })}
            placeholder="Architecture notes and remarks..."
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-300 text-[11px] focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Color Theme */}
        <div>
          <label className="text-slate-400 block mb-1">Accent Theme</label>
          <div className="flex space-x-2">
            {(['blue', 'emerald', 'purple', 'amber', 'rose', 'slate'] as const).map(color => (
              <button
                key={color}
                onClick={() => updateNode(selectedNode.id, { colorTheme: color })}
                className={`w-6 h-6 rounded-full border transition-transform ${
                  selectedNode.colorTheme === color ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                } ${
                  color === 'blue' ? 'bg-sky-500 border-sky-400' :
                  color === 'emerald' ? 'bg-emerald-500 border-emerald-400' :
                  color === 'purple' ? 'bg-purple-500 border-purple-400' :
                  color === 'amber' ? 'bg-amber-500 border-amber-400' :
                  color === 'rose' ? 'bg-rose-500 border-rose-400' :
                  'bg-slate-600 border-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* UML Attributes Section */}
        {isUml && selectedNode.type !== 'uml_interface' && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 text-xs">Attributes / Fields</span>
              <button
                onClick={handleAddAttribute}
                className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(selectedNode.attributes || []).map(attr => (
                <div key={attr.id} className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded border border-slate-800">
                  <select
                    value={attr.visibility}
                    onChange={e => handleUpdateAttribute(attr.id, { visibility: e.target.value })}
                    className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none"
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="#">#</option>
                    <option value="~">~</option>
                  </select>
                  <input
                    type="text"
                    value={attr.name}
                    onChange={e => handleUpdateAttribute(attr.id, { name: e.target.value })}
                    className="w-20 bg-slate-900 px-1 py-0.5 rounded text-[11px] text-slate-200"
                    placeholder="name"
                  />
                  <span className="text-slate-500">:</span>
                  <input
                    type="text"
                    value={attr.type}
                    onChange={e => handleUpdateAttribute(attr.id, { type: e.target.value })}
                    className="w-20 bg-slate-900 px-1 py-0.5 rounded text-[11px] text-sky-400"
                    placeholder="type"
                  />
                  <button
                    onClick={() => handleDeleteAttribute(attr.id)}
                    className="text-slate-500 hover:text-rose-400 ml-auto p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UML Methods Section */}
        {isUml && selectedNode.type !== 'uml_enum' && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 text-xs">Methods / Operations</span>
              <button
                onClick={handleAddMethod}
                className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(selectedNode.methods || []).map(m => (
                <div key={m.id} className="flex flex-col space-y-1 bg-slate-950 p-1.5 rounded border border-slate-800">
                  <div className="flex items-center space-x-1">
                    <select
                      value={m.visibility}
                      onChange={e => handleUpdateMethod(m.id, { visibility: e.target.value })}
                      className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none"
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="#">#</option>
                      <option value="~">~</option>
                    </select>
                    <input
                      type="text"
                      value={m.name}
                      onChange={e => handleUpdateMethod(m.id, { name: e.target.value })}
                      className="flex-1 bg-slate-900 px-1 py-0.5 rounded text-[11px] text-slate-200"
                      placeholder="methodName"
                    />
                    <button
                      onClick={() => handleDeleteMethod(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px]">
                    <input
                      type="text"
                      value={m.parameters}
                      onChange={e => handleUpdateMethod(m.id, { parameters: e.target.value })}
                      className="flex-1 bg-slate-900 px-1 py-0.5 rounded text-slate-400"
                      placeholder="params (e.g. id: string)"
                    />
                    <span className="text-slate-500">:</span>
                    <input
                      type="text"
                      value={m.returnType}
                      onChange={e => handleUpdateMethod(m.id, { returnType: e.target.value })}
                      className="w-16 bg-slate-900 px-1 py-0.5 rounded text-emerald-400"
                      placeholder="void"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERD Columns Section */}
        {isErd && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 text-xs">Table Columns</span>
              <button
                onClick={handleAddColumn}
                className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="w-3 h-3" />
                <span>Add Column</span>
              </button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {(selectedNode.columns || []).map(col => (
                <div key={col.id} className="flex flex-col space-y-1 bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={col.name}
                      onChange={e => handleUpdateColumn(col.id, { name: e.target.value })}
                      className="flex-1 bg-slate-900 px-1.5 py-0.5 rounded text-slate-100 font-medium"
                      placeholder="col_name"
                    />
                    <input
                      type="text"
                      value={col.type}
                      onChange={e => handleUpdateColumn(col.id, { type: e.target.value })}
                      className="w-24 bg-slate-900 px-1.5 py-0.5 rounded text-sky-400 font-mono text-[10px]"
                      placeholder="VARCHAR(255)"
                    />
                    <button
                      onClick={() => handleDeleteColumn(col.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-0.5">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.isPk}
                        onChange={e => handleUpdateColumn(col.id, { isPk: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                      />
                      <span className={col.isPk ? 'text-amber-400 font-bold' : ''}>PK</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.isFk}
                        onChange={e => handleUpdateColumn(col.id, { isFk: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                      />
                      <span className={col.isFk ? 'text-sky-400 font-bold' : ''}>FK</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!col.isNullable}
                        onChange={e => handleUpdateColumn(col.id, { isNullable: !e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
                      />
                      <span className={!col.isNullable ? 'text-rose-400 font-bold' : ''}>Not Null</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Element Button */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Element</span>
          </button>
        </div>
      </div>
    </div>
  );
};
