/**
 * OPM-Pro Diagram Synthesis Service
 * Synthesizes OPM Diagrammatic Representations (OPDs) from pure Information Models.
 * 
 * Analyzes the logical ontology, detects process decomposition depth,
 * and generates:
 * 1. System Diagram (SD) for root-level processes and objects.
 * 2. In-zoomed OPDs for every decomposed process in the hierarchy,
 *    arranging child subprocesses and interacting objects.
 * 3. Coherent visual layouts, state nesting, and visual tag styles.
 * 
 * Copyright (c) 2026 Avi Shaked. All rights reserved.
 */

import { 
  ElementType, 
  LinkType, 
  LogicalElement, 
  LogicalLink, 
  TagDefinition, 
  OPD, 
  VisualElement, 
  VisualLink, 
  VisualTagStyle 
} from '../types';

export interface ModelHierarchyInfo {
  maxDepth: number;
  totalElements: number;
  objectCount: number;
  processCount: number;
  stateCount: number;
  linkCount: number;
  decomposedProcesses: {
    process: LogicalElement;
    childCount: number;
    depth: number;
  }[];
  plannedDiagrams: {
    name: string;
    parentProcessName?: string;
    level: string;
    elementCount: number;
  }[];
}

const PALETTE = [
  '#2563eb', // blue
  '#059669', // emerald
  '#7c3aed', // violet
  '#d97706', // amber
  '#dc2626', // red
  '#0891b2', // cyan
  '#db2777', // pink
  '#4b5563', // slate
];

/**
 * Generate a deterministic UUID v4 string
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
}

/**
 * Analyzes a pure logical model to assess structural depth and hierarchy.
 */
export function analyzeModelHierarchy(logical: {
  elements: LogicalElement[];
  links: LogicalLink[];
  tags?: TagDefinition[];
}): ModelHierarchyInfo {
  const elements = logical.elements || [];
  const links = logical.links || [];

  const objects = elements.filter(e => e.type === ElementType.OBJECT);
  const processes = elements.filter(e => e.type === ElementType.PROCESS);
  const states = elements.filter(e => e.type === ElementType.STATE);

  // Compute depth for processes
  const processDepthMap = new Map<string, number>();

  function getProcessDepth(pId: string, visited: Set<string> = new Set()): number {
    if (visited.has(pId)) return 0;
    visited.add(pId);
    if (processDepthMap.has(pId)) return processDepthMap.get(pId)!;

    const proc = processes.find(p => p.id === pId);
    if (!proc || !proc.parentId) {
      processDepthMap.set(pId, 0);
      return 0;
    }

    const parentProc = processes.find(p => p.id === proc.parentId);
    if (!parentProc) {
      processDepthMap.set(pId, 0);
      return 0;
    }

    const d = 1 + getProcessDepth(parentProc.id, visited);
    processDepthMap.set(pId, d);
    return d;
  }

  processes.forEach(p => getProcessDepth(p.id));

  // Find all processes that have child subprocesses
  const decomposedProcesses: { process: LogicalElement; childCount: number; depth: number }[] = [];
  processes.forEach(p => {
    const children = processes.filter(c => c.parentId === p.id);
    if (children.length > 0) {
      decomposedProcesses.push({
        process: p,
        childCount: children.length,
        depth: processDepthMap.get(p.id) || 0
      });
    }
  });

  // Sort decomposed processes by depth so shallower in-zoomed OPDs come first
  decomposedProcesses.sort((a, b) => a.depth - b.depth);

  const maxDepth = decomposedProcesses.length > 0 
    ? Math.max(...decomposedProcesses.map(d => d.depth + 1)) 
    : 0;

  // Root elements count for SD
  const rootElements = elements.filter(e => !e.parentId || e.type === ElementType.STATE);

  const plannedDiagrams: { name: string; parentProcessName?: string; level: string; elementCount: number }[] = [
    {
      name: 'SD (System Diagram)',
      level: 'System Level (Root)',
      elementCount: rootElements.length
    }
  ];

  decomposedProcesses.forEach(dp => {
    plannedDiagrams.push({
      name: `${dp.process.name} in-zoomed`,
      parentProcessName: dp.process.name,
      level: `Level ${dp.depth + 1} Decomposition`,
      elementCount: dp.childCount + 1
    });
  });

  return {
    maxDepth,
    totalElements: elements.length,
    objectCount: objects.length,
    processCount: processes.length,
    stateCount: states.length,
    linkCount: links.length,
    decomposedProcesses,
    plannedDiagrams
  };
}

/**
 * Synthesize complete OPDs (Visual representation) from a pure Logical Model.
 */
export function synthesizeDiagramsFromLogical(logical: {
  elements: LogicalElement[];
  links: LogicalLink[];
  tags?: TagDefinition[];
}): { opds: OPD[]; currentOpdId: string } {
  const elements = logical.elements || [];
  const links = logical.links || [];
  const tags = logical.tags || [];

  // 1. Build Visual Tag Styles
  const tagStyles: VisualTagStyle[] = tags.map((t, idx) => ({
    tag: t.name,
    color: PALETTE[idx % PALETTE.length],
    lineStyle: (idx % 2 === 0 ? 'solid' : 'dashed') as any,
    showTagLabel: true
  }));

  // Also collect tags from links that don't have explicit TagDefinition
  links.forEach(l => {
    if (l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim()) {
      const cleanTag = l.tag.trim();
      if (!tagStyles.some(ts => ts.tag.toLowerCase() === cleanTag.toLowerCase())) {
        tagStyles.push({
          tag: cleanTag,
          color: PALETTE[tagStyles.length % PALETTE.length],
          lineStyle: 'dashed',
          showTagLabel: true
        });
      }
    }
  });

  const opds: OPD[] = [];

  // ==========================================
  // A. Generate Root System Diagram (SD)
  // ==========================================
  const sdId = generateId();
  const rootObjects = elements.filter(e => e.type === ElementType.OBJECT && !e.parentId);
  const rootProcesses = elements.filter(e => e.type === ElementType.PROCESS && !e.parentId);

  // If there are no root elements (e.g., all have parentId), fallback to treating all objects & processes as root
  const effectiveRootObjects = rootObjects.length > 0 ? rootObjects : elements.filter(e => e.type === ElementType.OBJECT);
  const effectiveRootProcesses = rootProcesses.length > 0 ? rootProcesses : elements.filter(e => e.type === ElementType.PROCESS);

  // Classify root objects: inputs (consumption/instrument/agent), outputs (result/effect), or other
  const inputObjectIds = new Set<string>();
  const outputObjectIds = new Set<string>();

  links.forEach(l => {
    if (effectiveRootProcesses.some(p => p.id === l.targetId) && effectiveRootObjects.some(o => o.id === l.sourceId)) {
      inputObjectIds.add(l.sourceId);
    } else if (effectiveRootProcesses.some(p => p.id === l.sourceId) && effectiveRootObjects.some(o => o.id === l.targetId)) {
      outputObjectIds.add(l.targetId);
    }
  });

  const leftObjects = effectiveRootObjects.filter(o => inputObjectIds.has(o.id) && !outputObjectIds.has(o.id));
  const rightObjects = effectiveRootObjects.filter(o => outputObjectIds.has(o.id));
  const otherObjects = effectiveRootObjects.filter(o => !leftObjects.includes(o) && !rightObjects.includes(o));

  // Layout calculations for SD
  const sdVisualElements: VisualElement[] = [];

  // Position Left Objects
  let curY = 80;
  leftObjects.forEach(obj => {
    const states = elements.filter(s => s.parentId === obj.id && s.type === ElementType.STATE);
    const objWidth = Math.max(120, states.length * 80 + 30);
    const objHeight = states.length > 0 ? 90 : 60;
    sdVisualElements.push({
      id: obj.id,
      x: 60,
      y: curY,
      width: objWidth,
      height: objHeight
    });
    // Position states inside object
    states.forEach((state, sIdx) => {
      sdVisualElements.push({
        id: state.id,
        x: 15 + sIdx * 80,
        y: 45,
        width: 70,
        height: 32,
        parentId: obj.id
      });
    });
    curY += objHeight + 40;
  });

  // Position Processes (Center Column)
  const procX = Math.max(300, leftObjects.length > 0 ? 320 : 150);
  curY = 80;
  effectiveRootProcesses.forEach(proc => {
    const procWidth = 160;
    const procHeight = 75;
    sdVisualElements.push({
      id: proc.id,
      x: procX,
      y: curY,
      width: procWidth,
      height: procHeight
    });
    curY += procHeight + 50;
  });

  // Position Right Objects
  const rightX = procX + 260;
  curY = 80;
  rightObjects.forEach(obj => {
    const states = elements.filter(s => s.parentId === obj.id && s.type === ElementType.STATE);
    const objWidth = Math.max(120, states.length * 80 + 30);
    const objHeight = states.length > 0 ? 90 : 60;
    sdVisualElements.push({
      id: obj.id,
      x: rightX,
      y: curY,
      width: objWidth,
      height: objHeight
    });
    states.forEach((state, sIdx) => {
      sdVisualElements.push({
        id: state.id,
        x: 15 + sIdx * 80,
        y: 45,
        width: 70,
        height: 32,
        parentId: obj.id
      });
    });
    curY += objHeight + 40;
  });

  // Position Other Objects (Bottom or Top)
  let otherX = 60;
  const otherY = Math.max(curY, 320) + 40;
  otherObjects.forEach(obj => {
    const states = elements.filter(s => s.parentId === obj.id && s.type === ElementType.STATE);
    const objWidth = Math.max(120, states.length * 80 + 30);
    const objHeight = states.length > 0 ? 90 : 60;
    sdVisualElements.push({
      id: obj.id,
      x: otherX,
      y: otherY,
      width: objWidth,
      height: objHeight
    });
    states.forEach((state, sIdx) => {
      sdVisualElements.push({
        id: state.id,
        x: 15 + sIdx * 80,
        y: 45,
        width: 70,
        height: 32,
        parentId: obj.id
      });
    });
    otherX += objWidth + 40;
  });

  // Collect links whose endpoints are represented in SD
  const sdElementIds = new Set(sdVisualElements.map(v => v.id));
  const sdVisualLinks: VisualLink[] = links
    .filter(l => sdElementIds.has(l.sourceId) && sdElementIds.has(l.targetId))
    .map(l => ({ id: l.id }));

  opds.push({
    id: sdId,
    name: 'SD',
    visual: {
      elements: sdVisualElements,
      links: sdVisualLinks,
      tagStyles: [...tagStyles]
    }
  });

  // ==========================================
  // B. Generate In-Zoomed OPDs for Decomposed Processes
  // ==========================================
  const hierarchy = analyzeModelHierarchy(logical);

  hierarchy.decomposedProcesses.forEach(({ process: parentProc }) => {
    const opdId = generateId();
    const childSubprocesses = elements.filter(
      e => e.parentId === parentProc.id && e.type === ElementType.PROCESS
    );

    // Sort subprocesses based on INVOCATION links if available (temporal execution order)
    const sortedSubprocesses = [...childSubprocesses];
    const invocationLinks = links.filter(l => l.type === LinkType.INVOCATION);

    sortedSubprocesses.sort((a, b) => {
      if (invocationLinks.some(l => l.sourceId === a.id && l.targetId === b.id)) return -1;
      if (invocationLinks.some(l => l.sourceId === b.id && l.targetId === a.id)) return 1;
      return 0;
    });

    // Determine participating objects: objects connected to parentProc or any of its subprocesses
    const participatingObjectIds = new Set<string>();
    const allOpdProcIds = new Set([parentProc.id, ...childSubprocesses.map(c => c.id)]);

    links.forEach(l => {
      if (allOpdProcIds.has(l.sourceId)) {
        const targetEl = elements.find(e => e.id === l.targetId);
        if (targetEl && targetEl.type === ElementType.OBJECT) {
          participatingObjectIds.add(targetEl.id);
        } else if (targetEl && targetEl.type === ElementType.STATE && targetEl.parentId) {
          participatingObjectIds.add(targetEl.parentId);
        }
      }
      if (allOpdProcIds.has(l.targetId)) {
        const sourceEl = elements.find(e => e.id === l.sourceId);
        if (sourceEl && sourceEl.type === ElementType.OBJECT) {
          participatingObjectIds.add(sourceEl.id);
        } else if (sourceEl && sourceEl.type === ElementType.STATE && sourceEl.parentId) {
          participatingObjectIds.add(sourceEl.parentId);
        }
      }
    });

    const participatingObjects = elements.filter(e => participatingObjectIds.has(e.id));

    // Separate participating objects into input vs output
    const inObjIds = new Set<string>();
    const outObjIds = new Set<string>();

    links.forEach(l => {
      if (participatingObjectIds.has(l.sourceId) && allOpdProcIds.has(l.targetId)) {
        inObjIds.add(l.sourceId);
      }
      if (allOpdProcIds.has(l.sourceId) && participatingObjectIds.has(l.targetId)) {
        outObjIds.add(l.targetId);
      }
    });

    const opdLeftObjects = participatingObjects.filter(o => inObjIds.has(o.id) && !outObjIds.has(o.id));
    const opdRightObjects = participatingObjects.filter(o => outObjIds.has(o.id));
    const opdOtherObjects = participatingObjects.filter(o => !opdLeftObjects.includes(o) && !opdRightObjects.includes(o));

    const opdVisualElements: VisualElement[] = [];

    // Size of the parent container process
    const numSubs = sortedSubprocesses.length;
    const parentWidth = Math.max(540, numSubs * 140 + 80);
    const parentHeight = 320;
    const parentX = opdLeftObjects.length > 0 ? 220 : 80;
    const parentY = 80;

    // 1. Add the parent in-zoomed process itself
    opdVisualElements.push({
      id: parentProc.id,
      x: parentX,
      y: parentY,
      width: parentWidth,
      height: parentHeight
    });

    // 2. Position child subprocesses inside the parent process
    const subWidth = 120;
    const subHeight = 60;
    const subPaddingX = 40;
    const availableWidth = parentWidth - subPaddingX * 2;
    const subSpacingX = numSubs > 1 ? (availableWidth - subWidth) / (numSubs - 1) : 0;

    sortedSubprocesses.forEach((sub, idx) => {
      const subX = numSubs === 1 
        ? (parentWidth - subWidth) / 2 
        : subPaddingX + idx * subSpacingX;
      const subY = (parentHeight - subHeight) / 2;

      opdVisualElements.push({
        id: sub.id,
        x: Math.round(subX),
        y: Math.round(subY),
        width: subWidth,
        height: subHeight,
        parentId: parentProc.id
      });
    });

    // 3. Position Left Objects (Inputs)
    let leftObjY = parentY + 20;
    opdLeftObjects.forEach(obj => {
      const states = elements.filter(s => s.parentId === obj.id && s.type === ElementType.STATE);
      const oWidth = Math.max(110, states.length * 75 + 20);
      const oHeight = states.length > 0 ? 80 : 55;
      opdVisualElements.push({
        id: obj.id,
        x: 40,
        y: leftObjY,
        width: oWidth,
        height: oHeight
      });
      states.forEach((state, sIdx) => {
        opdVisualElements.push({
          id: state.id,
          x: 10 + sIdx * 75,
          y: 40,
          width: 65,
          height: 30,
          parentId: obj.id
        });
      });
      leftObjY += oHeight + 30;
    });

    // 4. Position Right Objects (Outputs)
    let rightObjY = parentY + 20;
    const rightSideX = parentX + parentWidth + 50;
    opdRightObjects.forEach(obj => {
      const states = elements.filter(s => s.parentId === obj.id && s.type === ElementType.STATE);
      const oWidth = Math.max(110, states.length * 75 + 20);
      const oHeight = states.length > 0 ? 80 : 55;
      opdVisualElements.push({
        id: obj.id,
        x: rightSideX,
        y: rightObjY,
        width: oWidth,
        height: oHeight
      });
      states.forEach((state, sIdx) => {
        opdVisualElements.push({
          id: state.id,
          x: 10 + sIdx * 75,
          y: 40,
          width: 65,
          height: 30,
          parentId: obj.id
        });
      });
      rightObjY += oHeight + 30;
    });

    // 5. Position Other Objects (Bottom)
    let bottomX = parentX;
    const bottomY = parentY + parentHeight + 40;
    opdOtherObjects.forEach(obj => {
      const states = elements.filter(s => s.parentId === obj.id && s.type === ElementType.STATE);
      const oWidth = Math.max(110, states.length * 75 + 20);
      const oHeight = states.length > 0 ? 80 : 55;
      opdVisualElements.push({
        id: obj.id,
        x: bottomX,
        y: bottomY,
        width: oWidth,
        height: oHeight
      });
      states.forEach((state, sIdx) => {
        opdVisualElements.push({
          id: state.id,
          x: 10 + sIdx * 75,
          y: 40,
          width: 65,
          height: 30,
          parentId: obj.id
        });
      });
      bottomX += oWidth + 30;
    });

    // 6. Connect Links
    const visibleInOpd = new Set(opdVisualElements.map(v => v.id));
    const opdVisualLinks: VisualLink[] = links
      .filter(l => visibleInOpd.has(l.sourceId) && visibleInOpd.has(l.targetId))
      .map(l => ({ id: l.id }));

    opds.push({
      id: opdId,
      name: `${parentProc.name} in-zoomed`,
      parentProcessId: parentProc.id,
      visual: {
        elements: opdVisualElements,
        links: opdVisualLinks,
        tagStyles: [...tagStyles]
      }
    });
  });

  return {
    opds,
    currentOpdId: sdId
  };
}
