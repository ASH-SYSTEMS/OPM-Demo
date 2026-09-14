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
  TAGGED_STRUCTURAL = 'TAGGED_STRUCTURAL',
  
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

export type TagLineStyle = 'solid' | 'dashed' | 'dotted' | 'dash-dot';

/**
 * Pure logical definition of a user-defined structural relation type (tag).
 * In ISO 19450, tagged structural links represent domain-specific structural relations.
 */
export interface TagDefinition {
  id: string;
  name: string; // e.g. "supports", "powers", "controls"
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

/**
 * Pure logical link in the system ontology.
 * Contains no visual coordinates, colors, or diagrammatic visibility settings.
 */
export interface LogicalLink {
  id: string;
  type: LinkType;
  sourceId: string;
  targetId: string;
  sourceCardinality?: string;
  targetCardinality?: string;
  tag?: string; // Semantic tag name or ID, e.g. "supports"
}

/**
 * Visual representation and styling of a structural tag in an Object-Process Diagram (OPD).
 */
export interface VisualTagStyle {
  tag: string; // The tag name this styling applies to
  color: string; // Stroke and badge accent color, e.g. "#2563eb"
  lineStyle: TagLineStyle; // 'solid' | 'dashed' | 'dotted' | 'dash-dot'
  showTagLabel?: boolean; // Default diagram visibility for badges of this tag
}

/**
 * Visual representation of a link in an Object-Process Diagram (OPD).
 */
export interface VisualLink {
  id: string;
  sourceAnchor?: { x: number, y: number }; // Relative to element top-left (0-1)
  targetAnchor?: { x: number, y: number }; // Relative to element top-left (0-1)
  showTagLabel?: boolean; // Per-link diagram visibility override (undefined = inherit from VisualTagStyle)
}

export interface OPD {
  id: string;
  name: string;
  parentProcessId?: string; // The process this OPD zooms into
  visual: {
    elements: VisualElement[];
    links: VisualLink[];
    tagStyles?: VisualTagStyle[]; // Diagrammatic styling for tagged structural links
  };
}

export interface OPMModel {
  logical: {
    elements: LogicalElement[];
    links: LogicalLink[];
    tags?: TagDefinition[]; // Pure logical structural tag relation types
  };
  opds: OPD[];
  currentOpdId: string;
}
