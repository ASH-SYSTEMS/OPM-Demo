/**
 * OPM-Pro System Type Definitions
 * Copyright (c) 2026 Avi Shaked. All rights reserved.
 * Permissive use granted with proper attribution to Avi Shaked.
 */

export enum ElementType {
  OBJECT = 'OBJECT',
  PROCESS = 'PROCESS',
  STATE = 'STATE',
}

export enum Essence {
  INFORMATIONAL = 'INFORMATIONAL',
  PHYSICAL = 'PHYSICAL',
}

export enum Affiliation {
  SYSTEMIC = 'SYSTEMIC',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
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
  CONDITION = 'CONDITION',
  EVENT = 'EVENT',
  EXCEPTION = 'EXCEPTION',
  INVOCATION = 'INVOCATION',
}

export interface LogicalElement {
  id: string;
  type: ElementType;
  name: string;
  essence: Essence;
  affiliation: Affiliation;
  parentId?: string; // Logical nesting (subprocess, state in object)
  isInitial?: boolean; // For states
  isFinal?: boolean; // For states
  isDefault?: boolean; // For states
  isActive?: boolean; // For states
}

export interface VisualElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string; // Visual nesting
  isExpanded?: boolean; // For processes (zoomed-in)
}

export interface LogicalLink {
  id: string;
  type: LinkType;
  sourceId: string;
  targetId: string;
  sourceCardinality?: string;
  targetCardinality?: string;
}

export interface VisualLink {
  id: string;
  sourceAnchor?: { x: number, y: number }; // Relative to element top-left (0-1)
  targetAnchor?: { x: number, y: number }; // Relative to element top-left (0-1)
}

export interface OPD {
  id: string;
  name: string;
  parentProcessId?: string; // The process this OPD zooms into
  visual: {
    elements: VisualElement[];
    links: VisualLink[];
  };
}

export interface OPMModel {
  logical: {
    elements: LogicalElement[];
    links: LogicalLink[];
  };
  opds: OPD[];
  currentOpdId: string;
}
