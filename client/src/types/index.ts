export type DiagramType = 
  | 'class' 
  | 'erd' 
  | 'usecase' 
  | 'sequence' 
  | 'activity' 
  | 'architecture';

export type NodeType = 
  | 'uml_class'
  | 'uml_interface'
  | 'uml_enum'
  | 'erd_table'
  | 'usecase_actor'
  | 'usecase_bubble'
  | 'usecase_boundary'
  | 'seq_lifeline'
  | 'activity_start'
  | 'activity_action'
  | 'activity_decision'
  | 'activity_end'
  | 'note'
  | 'package';

export type Visibility = '+' | '-' | '#' | '~';

export interface UMLAttribute {
  id: string;
  name: string;
  type: string;
  visibility: Visibility;
  defaultValue?: string;
}

export interface UMLMethod {
  id: string;
  name: string;
  parameters: string;
  returnType: string;
  visibility: Visibility;
  isStatic?: boolean;
  isAbstract?: boolean;
}

export interface ERDColumn {
  id: string;
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  stereotype?: string;
  description?: string;
  colorTheme?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'slate' | 'cyan';
  attributes?: UMLAttribute[];
  methods?: UMLMethod[];
  columns?: ERDColumn[];
  lifelineHeight?: number; // for sequence lifelines
  enumLiterals?: string[];
  customData?: Record<string, any>;
}

export type RelationshipType = 
  | 'association'
  | 'directed_association'
  | 'generalization'
  | 'realization'
  | 'dependency'
  | 'aggregation'
  | 'composition'
  | 'crows_foot_one_to_many'
  | 'crows_foot_one_to_one'
  | 'crows_foot_many_to_many'
  | 'usecase_include'
  | 'usecase_extend'
  | 'seq_sync_message'
  | 'seq_async_message'
  | 'seq_return_message'
  | 'activity_flow';

export interface DiagramEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  sourceAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'auto';
  targetAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'auto';
  sequenceOrder?: number;
}

export interface Diagram {
  id: string;
  name: string;
  type: DiagramType;
  description?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  zoom: number;
  pan: { x: number; y: number };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  diagrams: Diagram[];
  activeDiagramId: string;
}
