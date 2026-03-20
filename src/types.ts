export enum ElementType {
  OBJECT = 'OBJECT',
  PROCESS = 'PROCESS',
  STATE = 'STATE',
}

export enum LinkType {
  // Structural Links
  AGGREGATION = 'AGGREGATION',
  EXHIBITION = 'EXHIBITION',
  GENERALIZATION = 'GENERALIZATION',
  INSTANTIATION = 'INSTANTIATION',
  
  // Procedural Links
  CONSUMPTION = 'CONSUMPTION',
  RESULT = 'RESULT',
  EFFECT = 'EFFECT',
  AGENT = 'AGENT',
  INSTRUMENT = 'INSTRUMENT',
}

export interface OPMElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string; // For states inside objects
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface OPMLink {
  id: string;
  type: LinkType;
  sourceId: string;
  targetId: string;
  sourceAnchor?: { x: number, y: number }; // Relative to element top-left
  targetAnchor?: { x: number, y: number }; // Relative to element top-left
  sourceCardinality?: string;
  targetCardinality?: string;
}

export interface OPMModel {
  elements: OPMElement[];
  links: OPMLink[];
}
