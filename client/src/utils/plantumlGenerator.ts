import { DiagramNode, DiagramEdge, DiagramType } from '../types';

export function generateMermaid(
  diagramType: DiagramType,
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): string {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  if (diagramType === 'class') {
    let out = 'classDiagram\n';
    for (const node of nodes) {
      const name = sanitize(node.title);
      if (node.stereotype) {
        out += `  class ${name} {\n    <<${node.stereotype}>>\n`;
      } else {
        out += `  class ${name} {\n`;
      }
      for (const attr of node.attributes || []) {
        out += `    ${attr.visibility}${attr.type} ${attr.name}\n`;
      }
      for (const m of node.methods || []) {
        out += `    ${m.visibility}${m.name}(${m.parameters || ''}) ${m.returnType}\n`;
      }
      out += '  }\n';
    }

    for (const edge of edges) {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) continue;
      const s = sanitize(src.title);
      const t = sanitize(tgt.title);

      switch (edge.type) {
        case 'generalization':
          out += `  ${t} <|-- ${s}\n`;
          break;
        case 'realization':
          out += `  ${t} <|.. ${s}\n`;
          break;
        case 'composition':
          out += `  ${t} *-- ${s}\n`;
          break;
        case 'aggregation':
          out += `  ${t} o-- ${s}\n`;
          break;
        case 'dependency':
          out += `  ${s} ..> ${t}\n`;
          break;
        default:
          out += `  ${s} --> ${t} : ${edge.label || ''}\n`;
          break;
      }
    }
    return out;
  }

  if (diagramType === 'erd') {
    let out = 'erDiagram\n';
    for (const node of nodes) {
      const name = sanitize(node.title);
      out += `  ${name} {\n`;
      for (const col of node.columns || []) {
        const pk = col.isPk ? 'PK' : col.isFk ? 'FK' : '';
        out += `    ${sanitize(col.type)} ${sanitize(col.name)} ${pk}\n`;
      }
      out += '  }\n';
    }

    for (const edge of edges) {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) continue;
      const s = sanitize(src.title);
      const t = sanitize(tgt.title);

      if (edge.type === 'crows_foot_one_to_many') {
        out += `  ${s} ||--o{ ${t} : "${edge.label || 'has'}"\n`;
      } else if (edge.type === 'crows_foot_one_to_one') {
        out += `  ${s} ||--|| ${t} : "${edge.label || 'has'}"\n`;
      } else {
        out += `  ${s} }o--o{ ${t} : "${edge.label || 'relates'}"\n`;
      }
    }
    return out;
  }

  if (diagramType === 'sequence') {
    let out = 'sequenceDiagram\n';
    for (const node of nodes) {
      out += `  participant ${sanitize(node.title)}\n`;
    }
    const sortedEdges = [...edges].sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    for (const edge of sortedEdges) {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) continue;
      const s = sanitize(src.title);
      const t = sanitize(tgt.title);
      const msg = edge.label || 'message';

      if (edge.type === 'seq_sync_message') {
        out += `  ${s}->>${t}: ${msg}\n`;
      } else if (edge.type === 'seq_async_message') {
        out += `  ${s}->>${t}: ${msg}\n`;
      } else if (edge.type === 'seq_return_message') {
        out += `  ${s}-->>${t}: ${msg}\n`;
      } else {
        out += `  ${s}->>${t}: ${msg}\n`;
      }
    }
    return out;
  }

  // Fallback generic flowchart
  let out = 'flowchart TD\n';
  for (const node of nodes) {
    out += `  ${sanitize(node.id)}["${node.title}"]\n`;
  }
  for (const edge of edges) {
    const lbl = edge.label ? `|${edge.label}|` : '';
    out += `  ${sanitize(edge.sourceId)} -->${lbl} ${sanitize(edge.targetId)}\n`;
  }
  return out;
}

export function generatePlantUML(
  diagramType: DiagramType,
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): string {
  let out = `@startuml\nskinparam style strictuml\nskinparam defaultFontName "Inter"\n\n`;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  if (diagramType === 'class') {
    for (const node of nodes) {
      const isInterface = node.type === 'uml_interface';
      const kind = isInterface ? 'interface' : 'class';
      out += `${kind} "${node.title}" as ${sanitize(node.id)} {\n`;
      for (const attr of node.attributes || []) {
        out += `  ${attr.visibility}${attr.name} : ${attr.type}\n`;
      }
      for (const m of node.methods || []) {
        out += `  ${m.visibility}${m.name}(${m.parameters || ''}) : ${m.returnType}\n`;
      }
      out += `}\n\n`;
    }

    for (const edge of edges) {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) continue;
      const s = sanitize(src.id);
      const t = sanitize(tgt.id);

      switch (edge.type) {
        case 'generalization':
          out += `${t} <|-- ${s}\n`;
          break;
        case 'realization':
          out += `${t} <|.. ${s}\n`;
          break;
        case 'composition':
          out += `${t} *-- ${s}\n`;
          break;
        case 'aggregation':
          out += `${t} o-- ${s}\n`;
          break;
        case 'dependency':
          out += `${s} ..> ${t}\n`;
          break;
        default:
          out += `${s} --> ${t} : ${edge.label || ''}\n`;
          break;
      }
    }
  } else if (diagramType === 'sequence') {
    for (const node of nodes) {
      out += `participant "${node.title}" as ${sanitize(node.id)}\n`;
    }
    const sortedEdges = [...edges].sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    for (const edge of sortedEdges) {
      const s = sanitize(edge.sourceId);
      const t = sanitize(edge.targetId);
      const msg = edge.label || 'call';
      if (edge.type === 'seq_return_message') {
        out += `${s} --> ${t} : ${msg}\n`;
      } else {
        out += `${s} -> ${t} : ${msg}\n`;
      }
    }
  } else {
    for (const node of nodes) {
      out += `(${node.title}) as ${sanitize(node.id)}\n`;
    }
    for (const edge of edges) {
      out += `${sanitize(edge.sourceId)} --> ${sanitize(edge.targetId)} : ${edge.label || ''}\n`;
    }
  }

  out += `\n@enduml`;
  return out;
}

function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9_]/g, '');
}
