import { DiagramNode, DiagramEdge, RelationshipType } from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface ConnectionPath {
  path: string;
  sourcePoint: Point;
  targetPoint: Point;
  midPoint: Point;
  markerEnd?: string;
  markerStart?: string;
  strokeDasharray?: string;
}

/**
 * Calculates anchor point on a rectangle closest to a target point
 */
export function getClosestAnchor(
  node: DiagramNode,
  targetPoint: Point,
  forcedAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'auto'
): { point: Point; anchor: 'top' | 'right' | 'bottom' | 'left' } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;

  const anchors = {
    top: { x: cx, y: node.y },
    bottom: { x: cx, y: node.y + node.height },
    left: { x: node.x, y: cy },
    right: { x: node.x + node.width, y: cy },
  };

  if (forcedAnchor && forcedAnchor !== 'auto' && anchors[forcedAnchor]) {
    return { point: anchors[forcedAnchor], anchor: forcedAnchor };
  }

  // Find closest anchor to targetPoint
  let minDistance = Infinity;
  let bestAnchor: 'top' | 'right' | 'bottom' | 'left' = 'right';

  for (const [key, pt] of Object.entries(anchors) as ['top' | 'right' | 'bottom' | 'left', Point][]) {
    const dist = Math.hypot(pt.x - targetPoint.x, pt.y - targetPoint.y);
    if (dist < minDistance) {
      minDistance = dist;
      bestAnchor = key;
    }
  }

  return { point: anchors[bestAnchor], anchor: bestAnchor };
}

/**
 * Calculate path and markers for an edge
 */
export function calculateEdgePath(
  edge: DiagramEdge,
  sourceNode: DiagramNode,
  targetNode: DiagramNode,
  allEdges: DiagramEdge[]
): ConnectionPath {
  const isSequence = edge.type.startsWith('seq_');

  // Handle sequence diagram routing
  if (isSequence) {
    const seqEdges = allEdges
      .filter(e => e.type.startsWith('seq_'))
      .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    const edgeIndex = seqEdges.findIndex(e => e.id === edge.id);
    const order = edgeIndex !== -1 ? edgeIndex : (edge.sequenceOrder || 0);

    const startY = Math.max(sourceNode.y + 70, targetNode.y + 70) + order * 45;
    const srcX = sourceNode.x + sourceNode.width / 2;
    const tgtX = targetNode.x + targetNode.width / 2;

    const isSelf = sourceNode.id === targetNode.id;
    if (isSelf) {
      const p1 = { x: srcX, y: startY };
      const p2 = { x: srcX + 40, y: startY };
      const p3 = { x: srcX + 40, y: startY + 25 };
      const p4 = { x: srcX, y: startY + 25 };
      return {
        path: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y}`,
        sourcePoint: p1,
        targetPoint: p4,
        midPoint: { x: srcX + 50, y: startY + 12 },
        markerEnd: getMarkerEnd(edge.type),
        strokeDasharray: getStrokeDasharray(edge.type),
      };
    }

    const direction = tgtX >= srcX ? 1 : -1;
    const pSrc = { x: srcX + direction * 6, y: startY };
    const pTgt = { x: tgtX - direction * 6, y: startY };

    return {
      path: `M ${pSrc.x} ${pSrc.y} L ${pTgt.x} ${pTgt.y}`,
      sourcePoint: pSrc,
      targetPoint: pTgt,
      midPoint: { x: (pSrc.x + pTgt.x) / 2, y: startY - 10 },
      markerEnd: getMarkerEnd(edge.type),
      strokeDasharray: getStrokeDasharray(edge.type),
    };
  }

  // General UML / ERD Orthogonal or Curved Routing
  const srcCenter = { x: sourceNode.x + sourceNode.width / 2, y: sourceNode.y + sourceNode.height / 2 };
  const tgtCenter = { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 };

  const srcAnchorInfo = getClosestAnchor(sourceNode, tgtCenter, edge.sourceAnchor);
  const tgtAnchorInfo = getClosestAnchor(targetNode, srcCenter, edge.targetAnchor);

  const p1 = srcAnchorInfo.point;
  const p2 = tgtAnchorInfo.point;

  // Compute Orthogonal Manhattan route with clean corner radius
  const deltaX = p2.x - p1.x;
  const deltaY = p2.y - p1.y;

  let pathStr = '';
  let midPoint: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  if (srcAnchorInfo.anchor === 'left' || srcAnchorInfo.anchor === 'right') {
    const midX = p1.x + deltaX / 2;
    pathStr = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
    midPoint = { x: midX, y: (p1.y + p2.y) / 2 };
  } else {
    const midY = p1.y + deltaY / 2;
    pathStr = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
    midPoint = { x: (p1.x + p2.x) / 2, y: midY };
  }

  return {
    path: pathStr,
    sourcePoint: p1,
    targetPoint: p2,
    midPoint,
    markerEnd: getMarkerEnd(edge.type),
    markerStart: getMarkerStart(edge.type),
    strokeDasharray: getStrokeDasharray(edge.type),
  };
}

export function getMarkerEnd(type: RelationshipType): string {
  switch (type) {
    case 'generalization':
      return 'url(#marker-triangle-hollow)';
    case 'realization':
      return 'url(#marker-triangle-hollow)';
    case 'directed_association':
    case 'dependency':
    case 'usecase_include':
    case 'usecase_extend':
      return 'url(#marker-arrow-open)';
    case 'seq_sync_message':
      return 'url(#marker-arrow-filled)';
    case 'seq_async_message':
      return 'url(#marker-arrow-open)';
    case 'seq_return_message':
      return 'url(#marker-arrow-open-dashed)';
    case 'crows_foot_one_to_many':
      return 'url(#marker-crows-foot-many)';
    case 'crows_foot_one_to_one':
      return 'url(#marker-crows-foot-one)';
    case 'crows_foot_many_to_many':
      return 'url(#marker-crows-foot-many)';
    default:
      return '';
  }
}

export function getMarkerStart(type: RelationshipType): string {
  switch (type) {
    case 'composition':
      return 'url(#marker-diamond-filled)';
    case 'aggregation':
      return 'url(#marker-diamond-hollow)';
    case 'crows_foot_one_to_many':
      return 'url(#marker-crows-foot-one-start)';
    case 'crows_foot_many_to_many':
      return 'url(#marker-crows-foot-many-start)';
    default:
      return '';
  }
}

export function getStrokeDasharray(type: RelationshipType): string | undefined {
  if (
    type === 'realization' ||
    type === 'dependency' ||
    type === 'usecase_include' ||
    type === 'usecase_extend' ||
    type === 'seq_return_message'
  ) {
    return '5,5';
  }
  return undefined;
}
