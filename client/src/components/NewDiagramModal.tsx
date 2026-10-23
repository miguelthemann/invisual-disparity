import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { DiagramType } from '../types';
import { X, FileCode, Database, Workflow, User, Layers, Plus } from 'lucide-react';

interface NewDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDiagramModal: React.FC<NewDiagramModalProps> = ({ isOpen, onClose }) => {
  const { addDiagram } = useProject();
  const [name, setName] = useState('');
  const [type, setType] = useState<DiagramType>('class');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `${type.toUpperCase()} Diagram`;
    addDiagram(finalName, type, description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  const types = [
    {
      id: 'class' as DiagramType,
      title: 'UML Class Diagram',
      desc: 'Object-oriented software architecture with classes, interfaces, attributes, and methods',
      icon: <FileCode className="w-6 h-6 text-sky-400" />,
      color: 'border-sky-500/40 bg-sky-950/20',
    },
    {
      id: 'erd' as DiagramType,
      title: 'Entity Relationship (ERD)',
      desc: 'Relational database schema with tables, columns, primary keys, and Crow foot cardinality',
      icon: <Database className="w-6 h-6 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-950/20',
    },
    {
      id: 'sequence' as DiagramType,
      title: 'Sequence Diagram',
      desc: 'System interactions, lifelines, synchronous/asynchronous messages, and return flows',
      icon: <Workflow className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/40 bg-purple-950/20',
    },
    {
      id: 'usecase' as DiagramType,
      title: 'Use Case Diagram',
      desc: 'Business requirements, actors, subsystem boundaries, include and extend actions',
      icon: <User className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-950/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base text-slate-100">Create New Diagram</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Diagram Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Order Processing Flow or Inventory Schema"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Diagram Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {types.map(t => (
                <div
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col space-y-1.5 ${
                    type === t.id
                      ? `${t.color} ring-2 ring-sky-500/50`
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {t.icon}
                    <span className="font-semibold text-xs text-slate-200">{t.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Context or notes about this diagram..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              Create Diagram
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
