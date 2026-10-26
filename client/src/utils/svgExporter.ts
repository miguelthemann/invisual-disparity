import { Diagram, DiagramNode, DiagramEdge } from '../types';
import { calculateEdgePath } from './connectorRouting';

/**
 * Generates a standalone, beautiful SVG vector graphic of any diagram.
 * Renders both connectors/arrows AND the nodes (classes, interfaces, tables, lifelines, use cases)
 * with complete styling, badges, and layout dimensions.
 */
export function exportDiagramToSvg(diagram: Diagram): string {
  if (!diagram || diagram.nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="100%" height="100%" fill="#090d16"/>
      <text x="200" y="100" fill="#64748b" text-anchor="middle" font-family="Inter, sans-serif" font-size="14">Empty Diagram</text>
    </svg>`;
  }

  // Calculate bounding box containing all nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of diagram.nodes) {
    const nodeRight = node.x + (node.width || 200);
    const nodeBottom = node.y + (node.height || 160) + (node.type === 'seq_lifeline' ? (node.lifelineHeight || 400) : 0);
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    if (nodeRight > maxX) maxX = nodeRight;
    if (nodeBottom > maxY) maxY = nodeBottom;
  }

  const padding = 50;
  const bboxX = Math.max(0, minX - padding);
  const bboxY = Math.max(0, minY - padding);
  const width = Math.max(800, maxX - bboxX + padding);
  const height = Math.max(600, maxY - bboxY + padding);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bboxX} ${bboxY} ${width} ${height}" width="${width}" height="${height}">\n`;

  // Defs: styles and markers
  svg += `  <defs>\n`;
  svg += `    <style>\n`;
  svg += `      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Fira+Code:wght@400;500&amp;display=swap');\n`;
  svg += `      .text-title { font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; font-weight: 700; fill: #f8fafc; }\n`;
  svg += `      .text-sub { font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; font-weight: 500; fill: #94a3b8; }\n`;
  svg += `      .text-item { font-family: 'Fira Code', monospace, sans-serif; font-size: 11px; fill: #cbd5e1; }\n`;
  svg += `      .text-muted { font-family: 'Fira Code', monospace, sans-serif; font-size: 10px; fill: #64748b; }\n`;
  svg += `      .text-badge { font-family: 'Inter', -apple-system, sans-serif; font-size: 9px; font-weight: 700; }\n`;
  svg += `    </style>\n`;

  // Markers
  svg += `    <marker id="marker-arrow-open" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">\n`;
  svg += `      <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#94a3b8" stroke-width="1.5" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-arrow-filled" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">\n`;
  svg += `      <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-arrow-open-dashed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">\n`;
  svg += `      <path d="M 0 1 L 10 5 L 0 9" fill="none" stroke="#94a3b8" stroke-width="1.5" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-triangle-hollow" viewBox="0 0 14 14" refX="14" refY="7" markerWidth="12" markerHeight="12" orient="auto-start-reverse">\n`;
  svg += `      <polygon points="0,0 14,7 0,14" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-diamond-hollow" viewBox="0 0 16 10" refX="0" refY="5" markerWidth="14" markerHeight="9" orient="auto-start-reverse">\n`;
  svg += `      <polygon points="8,0 16,5 8,10 0,5" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-diamond-filled" viewBox="0 0 16 10" refX="0" refY="5" markerWidth="14" markerHeight="9" orient="auto-start-reverse">\n`;
  svg += `      <polygon points="8,0 16,5 8,10 0,5" fill="#94a3b8" stroke="#94a3b8" stroke-width="1" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-crows-foot-one" viewBox="0 0 16 16" refX="16" refY="8" markerWidth="12" markerHeight="12" orient="auto-start-reverse">\n`;
  svg += `      <line x1="6" y1="2" x2="6" y2="14" stroke="#38bdf8" stroke-width="2" />\n`;
  svg += `      <line x1="12" y1="2" x2="12" y2="14" stroke="#38bdf8" stroke-width="2" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-crows-foot-many" viewBox="0 0 20 16" refX="20" refY="8" markerWidth="16" markerHeight="14" orient="auto-start-reverse">\n`;
  svg += `      <circle cx="5" cy="8" r="3.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />\n`;
  svg += `      <path d="M 10 2 L 20 8 L 10 14 M 10 8 L 20 8" fill="none" stroke="#38bdf8" stroke-width="1.5" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-crows-foot-one-start" viewBox="0 0 16 16" refX="0" refY="8" markerWidth="12" markerHeight="12" orient="auto-start-reverse">\n`;
  svg += `      <line x1="4" y1="2" x2="4" y2="14" stroke="#38bdf8" stroke-width="2" />\n`;
  svg += `      <line x1="10" y1="2" x2="10" y2="14" stroke="#38bdf8" stroke-width="2" />\n`;
  svg += `    </marker>\n`;

  svg += `    <marker id="marker-crows-foot-many-start" viewBox="0 0 20 16" refX="0" refY="8" markerWidth="16" markerHeight="14" orient="auto-start-reverse">\n`;
  svg += `      <circle cx="15" cy="8" r="3.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />\n`;
  svg += `      <path d="M 10 2 L 0 8 L 10 14 M 10 8 L 0 8" fill="none" stroke="#38bdf8" stroke-width="1.5" />\n`;
  svg += `    </marker>\n`;

  // Grid pattern
  svg += `    <pattern id="grid-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">\n`;
  svg += `      <circle cx="2" cy="2" r="1" fill="#1e293b" />\n`;
  svg += `    </pattern>\n`;
  svg += `  </defs>\n\n`;

  // Background
  svg += `  <!-- Background -->\n`;
  svg += `  <rect x="${bboxX}" y="${bboxY}" width="${width}" height="${height}" fill="#0b0f19" />\n`;
  svg += `  <rect x="${bboxX}" y="${bboxY}" width="${width}" height="${height}" fill="url(#grid-dots)" opacity="0.6" />\n\n`;

  // Render Edges
  svg += `  <!-- Edges & Connectors -->\n`;
  svg += `  <g id="edges">\n`;
  for (const edge of diagram.edges) {
    const srcNode = diagram.nodes.find(n => n.id === edge.sourceId);
    const tgtNode = diagram.nodes.find(n => n.id === edge.targetId);
    if (!srcNode || !tgtNode) continue;

    const pathInfo = calculateEdgePath(edge, srcNode, tgtNode, diagram.edges);
    const strokeDash = pathInfo.strokeDasharray ? `stroke-dasharray="${pathInfo.strokeDasharray}"` : '';
    const markerE = pathInfo.markerEnd ? `marker-end="${pathInfo.markerEnd}"` : '';
    const markerS = pathInfo.markerStart ? `marker-start="${pathInfo.markerStart}"` : '';

    svg += `    <path d="${pathInfo.path}" fill="none" stroke="#64748b" stroke-width="1.8" ${strokeDash} ${markerE} ${markerS} />\n`;

    if (edge.label) {
      const labelW = Math.max(50, edge.label.length * 7 + 16);
      const labelX = pathInfo.midPoint.x - labelW / 2;
      const labelY = pathInfo.midPoint.y - 10;
      svg += `    <rect x="${labelX}" y="${labelY}" width="${labelW}" height="20" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1" />\n`;
      svg += `    <text x="${pathInfo.midPoint.x}" y="${pathInfo.midPoint.y + 4}" text-anchor="middle" class="text-sub" fill="#e2e8f0">${escapeXml(edge.label)}</text>\n`;
    }

    if (edge.sourceMultiplicity) {
      svg += `    <text x="${pathInfo.sourcePoint.x + 8}" y="${pathInfo.sourcePoint.y - 6}" class="text-sub" fill="#38bdf8">${escapeXml(edge.sourceMultiplicity)}</text>\n`;
    }
    if (edge.targetMultiplicity) {
      svg += `    <text x="${pathInfo.targetPoint.x - 18}" y="${pathInfo.targetPoint.y - 6}" class="text-sub" fill="#38bdf8">${escapeXml(edge.targetMultiplicity)}</text>\n`;
    }
  }
  svg += `  </g>\n\n`;

  // Render Nodes
  svg += `  <!-- Nodes -->\n`;
  svg += `  <g id="nodes">\n`;
  for (const node of diagram.nodes) {
    svg += renderNodeSvg(node);
  }
  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}

function renderNodeSvg(node: DiagramNode): string {
  const w = node.width || 220;
  const h = node.height || 180;
  let out = '';

  switch (node.type) {
    case 'uml_class':
    case 'uml_interface':
    case 'uml_enum': {
      const headerBg = node.type === 'uml_interface' ? '#451a03' : node.type === 'uml_enum' ? '#1e293b' : '#0c2340';
      const headerBorder = node.type === 'uml_interface' ? '#d97706' : node.type === 'uml_enum' ? '#64748b' : '#0284c7';
      const stereotypeText = node.stereotype ? `&lt;&lt;${node.stereotype}&gt;&gt;` : node.type === 'uml_interface' ? '&lt;&lt;interface&gt;&gt;' : node.type === 'uml_enum' ? '&lt;&lt;enum&gt;&gt;' : '';
      const headerH = stereotypeText ? 44 : 36;

      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      // Main box
      out += `    <rect width="${w}" height="${h}" rx="8" fill="#0f172a" stroke="${headerBorder}" stroke-width="1.5" />\n`;
      // Header fill
      out += `    <path d="M 1 8 Q 1 1 8 1 L ${w - 8} 1 Q ${w - 1} 1 ${w - 1} 8 L ${w - 1} ${headerH} L 1 ${headerH} Z" fill="${headerBg}" />\n`;
      out += `    <line x1="1" y1="${headerH}" x2="${w - 1}" y2="${headerH}" stroke="${headerBorder}" stroke-width="1" />\n`;

      if (stereotypeText) {
        out += `    <text x="${w / 2}" y="16" text-anchor="middle" class="text-sub" fill="#94a3b8">${stereotypeText}</text>\n`;
        out += `    <text x="${w / 2}" y="34" text-anchor="middle" class="text-title">${escapeXml(node.title)}</text>\n`;
      } else {
        out += `    <text x="${w / 2}" y="24" text-anchor="middle" class="text-title">${escapeXml(node.title)}</text>\n`;
      }

      // Attributes
      let currY = headerH + 18;
      const attrs = node.attributes || [];
      for (const attr of attrs) {
        if (currY > h - 15) break;
        const visColor = attr.visibility === '+' ? '#22c55e' : attr.visibility === '-' ? '#ef4444' : '#eab308';
        out += `    <text x="12" y="${currY}" class="text-item" fill="${visColor}" font-weight="bold">${attr.visibility}</text>\n`;
        out += `    <text x="24" y="${currY}" class="text-item">${escapeXml(attr.name)}: <tspan fill="#94a3b8">${escapeXml(attr.type)}</tspan></text>\n`;
        currY += 16;
      }

      // Divider before methods if methods exist
      const methods = node.methods || [];
      if (methods.length > 0) {
        out += `    <line x1="1" y1="${currY}" x2="${w - 1}" y2="${currY}" stroke="#334155" stroke-width="1" />\n`;
        currY += 16;
        for (const m of methods) {
          if (currY > h - 10) break;
          const visColor = m.visibility === '+' ? '#22c55e' : m.visibility === '-' ? '#ef4444' : '#eab308';
          out += `    <text x="12" y="${currY}" class="text-item" fill="${visColor}" font-weight="bold">${m.visibility}</text>\n`;
          out += `    <text x="24" y="${currY}" class="text-item">${escapeXml(m.name)}(): <tspan fill="#94a3b8">${escapeXml(m.returnType)}</tspan></text>\n`;
          currY += 16;
        }
      }

      // Enum literals
      if (node.type === 'uml_enum' && node.enumLiterals) {
        for (const lit of node.enumLiterals) {
          if (currY > h - 10) break;
          out += `    <text x="16" y="${currY}" class="text-item" fill="#38bdf8">${escapeXml(lit)}</text>\n`;
          currY += 16;
        }
      }

      out += `  </g>\n`;
      break;
    }

    case 'erd_table': {
      const headerH = 34;
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      // Main box
      out += `    <rect width="${w}" height="${h}" rx="8" fill="#0f172a" stroke="#059669" stroke-width="1.5" />\n`;
      // Header fill
      out += `    <path d="M 1 8 Q 1 1 8 1 L ${w - 8} 1 Q ${w - 1} 1 ${w - 1} 8 L ${w - 1} ${headerH} L 1 ${headerH} Z" fill="#064e3b" />\n`;
      out += `    <line x1="1" y1="${headerH}" x2="${w - 1}" y2="${headerH}" stroke="#059669" stroke-width="1" />\n`;
      out += `    <text x="${w / 2}" y="22" text-anchor="middle" class="text-title">${escapeXml(node.title)}</text>\n`;

      let currY = headerH + 18;
      for (const col of node.columns || []) {
        if (currY > h - 10) break;
        // Key badges
        if (col.isPk) {
          out += `    <rect x="10" y="${currY - 11}" width="20" height="13" rx="3" fill="#ca8a04" />\n`;
          out += `    <text x="20" y="${currY - 1}" text-anchor="middle" class="text-badge" fill="#ffffff">PK</text>\n`;
        } else if (col.isFk) {
          out += `    <rect x="10" y="${currY - 11}" width="20" height="13" rx="3" fill="#2563eb" />\n`;
          out += `    <text x="20" y="${currY - 1}" text-anchor="middle" class="text-badge" fill="#ffffff">FK</text>\n`;
        }

        const nameX = col.isPk || col.isFk ? 36 : 14;
        const colColor = col.isPk ? '#fef08a' : '#f1f5f9';
        out += `    <text x="${nameX}" y="${currY}" class="text-item" fill="${colColor}">${escapeXml(col.name)}</text>\n`;
        out += `    <text x="${w - 14}" y="${currY}" text-anchor="end" class="text-muted">${escapeXml(col.type)}</text>\n`;
        currY += 18;
      }
      out += `  </g>\n`;
      break;
    }

    case 'seq_lifeline': {
      const lifeH = node.lifelineHeight || 440;
      const midX = w / 2;
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      // Header box
      out += `    <rect width="${w}" height="${h}" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" />\n`;
      out += `    <text x="${midX}" y="${h / 2 + 5}" text-anchor="middle" class="text-title">${escapeXml(node.title)}</text>\n`;
      // Dashed vertical lifeline
      out += `    <line x1="${midX}" y1="${h}" x2="${midX}" y2="${h + lifeH}" stroke="#6366f1" stroke-width="1.8" stroke-dasharray="6,4" />\n`;
      // End bar
      out += `    <line x1="${midX - 16}" y1="${h + lifeH}" x2="${midX + 16}" y2="${h + lifeH}" stroke="#6366f1" stroke-width="2" />\n`;
      out += `  </g>\n`;
      break;
    }

    case 'usecase_bubble': {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      out += `    <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 2}" ry="${h / 2 - 2}" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />\n`;
      out += `    <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" class="text-title">${escapeXml(node.title)}</text>\n`;
      out += `  </g>\n`;
      break;
    }

    case 'usecase_actor': {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      // Stick figure
      const cx = w / 2;
      out += `    <circle cx="${cx}" cy="18" r="12" fill="none" stroke="#38bdf8" stroke-width="2" />\n`;
      out += `    <line x1="${cx}" y1="30" x2="${cx}" y2="60" stroke="#38bdf8" stroke-width="2" />\n`;
      out += `    <line x1="${cx - 20}" y1="42" x2="${cx + 20}" y2="42" stroke="#38bdf8" stroke-width="2" />\n`;
      out += `    <line x1="${cx}" y1="60" x2="${cx - 16}" y2="85" stroke="#38bdf8" stroke-width="2" />\n`;
      out += `    <line x1="${cx}" y1="60" x2="${cx + 16}" y2="85" stroke="#38bdf8" stroke-width="2" />\n`;
      out += `    <text x="${cx}" y="105" text-anchor="middle" class="text-title" fill="#f8fafc">${escapeXml(node.title)}</text>\n`;
      out += `  </g>\n`;
      break;
    }

    case 'activity_start': {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      out += `    <circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 2}" fill="#10b981" stroke="#34d399" stroke-width="2" />\n`;
      out += `  </g>\n`;
      break;
    }

    case 'activity_end': {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      out += `    <circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 2}" fill="none" stroke="#f43f5e" stroke-width="2" />\n`;
      out += `    <circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 7}" fill="#f43f5e" />\n`;
      out += `  </g>\n`;
      break;
    }

    case 'activity_decision': {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      out += `    <polygon points="${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}" fill="#78350f" stroke="#f59e0b" stroke-width="1.8" />\n`;
      out += `    <text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" class="text-sub" fill="#fef08a">${escapeXml(node.title)}</text>\n`;
      out += `  </g>\n`;
      break;
    }

    case 'note': {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      out += `    <polygon points="0,0 ${w - 15},0 ${w},15 ${w},${h} 0,${h}" fill="#451a03" stroke="#d97706" stroke-width="1.5" />\n`;
      out += `    <polygon points="${w - 15},0 ${w - 15},15 ${w},15" fill="#78350f" stroke="#d97706" stroke-width="1" />\n`;
      const noteRaw = node.description || node.title || '';
      const lines = noteRaw.split('\n');
      out += `    <text x="12" y="24" class="text-sub" fill="#fde68a">\n`;
      lines.forEach((line, idx) => {
        out += `      <tspan x="12" dy="${idx === 0 ? '0' : '1.4em'}">${escapeXml(line)}</tspan>\n`;
      });
      out += `    </text>\n`;
      out += `  </g>\n`;
      break;
    }

    default: {
      out += `  <g transform="translate(${node.x}, ${node.y})">\n`;
      out += `    <rect width="${w}" height="${h}" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5" />\n`;
      out += `    <text x="${w / 2}" y="${h / 2}" text-anchor="middle" class="text-title">${escapeXml(node.title)}</text>\n`;
      out += `  </g>\n`;
      break;
    }
  }

  return out;
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
