import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { generateSqlDDL, SqlDialect } from '../utils/sqlGenerator';
import { X, Copy, Check, Download, Database } from 'lucide-react';

interface DDLGenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DDLGenModal: React.FC<DDLGenModalProps> = ({ isOpen, onClose }) => {
  const { activeDiagram, project } = useProject();
  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeDiagram) return null;

  // Use tables from active diagram or all ERD diagrams in the project
  const currentNodes = activeDiagram.type === 'erd' 
    ? activeDiagram.nodes 
    : project.diagrams.flatMap(d => d.nodes.filter(n => n.type === 'erd_table'));

  const currentEdges = activeDiagram.type === 'erd'
    ? activeDiagram.edges
    : project.diagrams.flatMap(d => d.edges);

  const sqlContent = generateSqlDDL(currentNodes, currentEdges, dialect);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${dialect}_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">SQL DDL Generator</h2>
              <p className="text-xs text-slate-400">Generate relational database schemas from ERD models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialect Tabs & Action Buttons */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1">
            {(['postgres', 'mysql', 'sqlite', 'oracle'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  dialect === d
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {d === 'postgres' ? 'PostgreSQL' : d}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* SQL Code View */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed selection:bg-emerald-500/30">
          <pre className="whitespace-pre-wrap">{sqlContent}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-right text-xs text-slate-500">
          Includes primary keys, foreign key constraints, data type mappings, and index definitions.
        </div>
      </div>
    </div>
  );
};
