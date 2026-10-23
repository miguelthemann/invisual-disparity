import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { generateCode, TargetLanguage } from '../utils/codeGenerator';
import { X, Copy, Check, Download, Code2 } from 'lucide-react';

interface CodeGenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeGenModal: React.FC<CodeGenModalProps> = ({ isOpen, onClose }) => {
  const { activeDiagram, project } = useProject();
  const [lang, setLang] = useState<TargetLanguage>('typescript');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeDiagram) return null;

  // Use classes from active diagram or all UML diagrams in project
  const currentNodes = activeDiagram.type === 'class'
    ? activeDiagram.nodes
    : project.diagrams.flatMap(d => d.nodes.filter(n => n.type.startsWith('uml_')));

  const currentEdges = activeDiagram.type === 'class'
    ? activeDiagram.edges
    : project.diagrams.flatMap(d => d.edges);

  const codeContent = generateCode(currentNodes, currentEdges, lang);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = lang === 'typescript' ? 'ts' : lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'go' ? 'go' : 'cs';
    const blob = new Blob([codeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_${lang}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">Code Generator</h2>
              <p className="text-xs text-slate-400">Generate software classes, interfaces, and methods from UML diagrams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs & Actions */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1">
            {(['typescript', 'python', 'java', 'go', 'csharp'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize tracking-wide transition-colors ${
                  lang === l
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {l === 'csharp' ? 'C#' : l}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed selection:bg-sky-500/30">
          <pre className="whitespace-pre-wrap">{codeContent}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-right text-xs text-slate-500">
          Supports inheritance, realizations, typed properties, access modifiers, and method stubs.
        </div>
      </div>
    </div>
  );
};
