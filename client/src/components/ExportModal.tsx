import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { generateMermaid, generatePlantUML } from '../utils/plantumlGenerator';
import { X, Copy, Check, Download, FileCode2, Share2, FileJson, Image } from './Icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { activeDiagram, project } = useProject();
  const [tab, setTab] = useState<'mermaid' | 'plantuml' | 'json' | 'svg'>('mermaid');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeDiagram) return null;

  const mermaidText = generateMermaid(activeDiagram.type, activeDiagram.nodes, activeDiagram.edges);
  const plantumlText = generatePlantUML(activeDiagram.type, activeDiagram.nodes, activeDiagram.edges);
  const jsonText = JSON.stringify(project, null, 2);

  const getExportContent = () => {
    switch (tab) {
      case 'mermaid': return mermaidText;
      case 'plantuml': return plantumlText;
      case 'json': return jsonText;
      case 'svg': return 'SVG Vector Export ready for download.';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (tab === 'svg') {
      const svgElement = document.getElementById('canvas-svg');
      if (svgElement) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDiagram.name.replace(/\s+/g, '_')}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }
      return;
    }

    let mime = 'text/plain';
    let ext = 'txt';
    let content = getExportContent();

    if (tab === 'mermaid') {
      ext = 'mmd';
    } else if (tab === 'plantuml') {
      ext = 'puml';
    } else if (tab === 'json') {
      ext = 'invisual.json';
      mime = 'application/json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDiagram.name.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">Export & Documentation</h2>
              <p className="text-xs text-slate-400">Export diagrams into vector graphics, Mermaid markdown, PlantUML, or JSON backup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setTab('mermaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                tab === 'mermaid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Mermaid.js</span>
            </button>
            <button
              onClick={() => setTab('plantuml')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                tab === 'plantuml' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>PlantUML</span>
            </button>
            <button
              onClick={() => setTab('svg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                tab === 'svg' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>SVG Vector</span>
            </button>
            <button
              onClick={() => setTab('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                tab === 'json' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Project JSON</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {tab !== 'svg' && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          {tab === 'svg' ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3 text-slate-400">
              <Image className="w-12 h-12 text-purple-400" />
              <p className="text-center text-sm">
                Ready to download the active diagram as a crisp, scalable SVG vector file.
              </p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">{getExportContent()}</pre>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 text-right text-xs text-slate-500">
          Perfect for embedding into README.md, GitLab/GitHub docs, or sharing with team members.
        </div>
      </div>
    </div>
  );
};
