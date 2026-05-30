/**
 * OPM-Pro OPL Generation Service
 * Copyright (c) 2026 Avi Shaked. All rights reserved.
 * Permissive use granted with proper attribution to Avi Shaked.
 */

import { 
  ElementType, 
  LinkType, 
  LogicalElement, 
  LogicalLink, 
  VisualElement, 
  VisualLink 
} from '../types';

export function generateOPL(logical: { elements: LogicalElement[], links: LogicalLink[] }, visual?: { elements: VisualElement[], links: VisualLink[] }): string[] {
  const sentences: string[] = [];
  
  // Filter logical elements and links to only those present in the current visual view if visual is provided
  const visibleElements = visual 
    ? logical.elements.filter(el => visual.elements.some(v => v.id === el.id))
    : logical.elements;
  const visibleLinks = visual
    ? logical.links.filter(l => visual.links.some(v => v.id === l.id))
    : logical.links;

  // 1. Describe Elements
  visibleElements.forEach(el => {
    if (el.type === ElementType.OBJECT && !el.parentId) {
      sentences.push(`${el.name} is an object.`);
      if (el.essence === 'PHYSICAL') sentences.push(`${el.name} is physical.`);
      if (el.affiliation === 'ENVIRONMENTAL') sentences.push(`${el.name} is environmental.`);
      
      // Describe states
      const states = visibleElements.filter(s => s.parentId === el.id && s.type === ElementType.STATE);
      if (states.length > 0) {
        const stateNames = states.map(s => s.name).join(', ');
        sentences.push(`${el.name} can be ${stateNames}.`);
        
        states.forEach(s => {
          if (s.isInitial) sentences.push(`${s.name} of ${el.name} is initial.`);
          if (s.isFinal) sentences.push(`${s.name} of ${el.name} is final.`);
          if (s.isDefault) sentences.push(`${s.name} of ${el.name} is default.`);
        });
      }
    } else if (el.type === ElementType.PROCESS) {
      sentences.push(`${el.name} is a process.`);
      if (el.essence === 'PHYSICAL') sentences.push(`${el.name} is physical.`);
      if (el.affiliation === 'ENVIRONMENTAL') sentences.push(`${el.name} is environmental.`);
      
      // Describe subprocesses
      const subprocesses = visibleElements.filter(s => s.parentId === el.id && s.type === ElementType.PROCESS);
      if (subprocesses.length > 0) {
        // Sort subprocesses by vertical position for implicit invocation order if visual info is available
        const sortedSubs = [...subprocesses].sort((a, b) => {
          if (visual) {
            const vA = visual.elements.find(v => v.id === a.id);
            const vB = visual.elements.find(v => v.id === b.id);
            return (vA?.y || 0) - (vB?.y || 0);
          }
          return a.name.localeCompare(b.name);
        });

        const subNames = sortedSubs.map(s => s.name).join(', ');
        sentences.push(`${el.name} zooms into ${subNames}.`);

        // Implicit invocation
        if (sortedSubs.length > 1) {
          for (let i = 0; i < sortedSubs.length - 1; i++) {
            sentences.push(`${sortedSubs[i].name} invokes ${sortedSubs[i+1].name}.`);
          }
        }
      }
    }
  });

  // 2. Describe Links
  const handledLinkIds = new Set<string>();

  // Special case: State changes (Consumption + Result on same object)
  const getDescendantProcessIds = (processId: string): string[] => {
    const children = visibleElements.filter(el => el.parentId === processId && el.type === ElementType.PROCESS);
    let ids = [processId];
    children.forEach(child => {
      ids = [...ids, ...getDescendantProcessIds(child.id)];
    });
    return ids;
  };

  visibleElements.filter(el => el.type === ElementType.PROCESS).forEach(process => {
    const descendantIds = getDescendantProcessIds(process.id);
    const incomingConsumption = visibleLinks.filter(l => descendantIds.includes(l.targetId) && l.type === LinkType.CONSUMPTION);
    const outgoingResult = visibleLinks.filter(l => descendantIds.includes(l.sourceId) && l.type === LinkType.RESULT);

    incomingConsumption.forEach(inLink => {
      const sourceState = visibleElements.find(e => e.id === inLink.sourceId);
      if (sourceState?.type === ElementType.STATE && sourceState.parentId) {
        const parentObject = visibleElements.find(e => e.id === sourceState.parentId);
        
        outgoingResult.forEach(outLink => {
          const targetState = visibleElements.find(e => e.id === outLink.targetId);
          if (targetState?.type === ElementType.STATE && targetState.parentId === sourceState.parentId && sourceState.id !== targetState.id) {
            const sentence = `${process.name} changes ${parentObject?.name} from ${sourceState.name} to ${targetState.name}.`;
            if (!sentences.includes(sentence)) {
              sentences.push(sentence);
              if (inLink.targetId === process.id) handledLinkIds.add(inLink.id);
              if (outLink.sourceId === process.id) handledLinkIds.add(outLink.id);
            }
          }
        });
      } else if (sourceState?.type === ElementType.OBJECT) {
        outgoingResult.forEach(outLink => {
          if (outLink.targetId === sourceState.id) {
            const sentence = `${process.name} affects ${sourceState.name}.`;
            if (!sentences.includes(sentence)) {
              sentences.push(sentence);
              if (inLink.targetId === process.id) handledLinkIds.add(inLink.id);
              if (outLink.sourceId === process.id) handledLinkIds.add(outLink.id);
            }
          }
        });
      }
    });
  });

  visibleLinks.forEach(link => {
    if (handledLinkIds.has(link.id)) return;
    
    const source = visibleElements.find(e => e.id === link.sourceId);
    const target = visibleElements.find(e => e.id === link.targetId);
    if (!source || !target) return;

    const getElementName = (el: LogicalElement) => {
      if (el.type === ElementType.STATE && el.parentId) {
        const parent = visibleElements.find(p => p.id === el.parentId);
        return `${el.name} of ${parent?.name || 'unknown'}`;
      }
      return el.name;
    };

    const sName = getElementName(source);
    const tName = getElementName(target);

    switch (link.type) {
      case LinkType.AGGREGATION:
        sentences.push(`${sName} consists of ${tName}.`);
        break;
      case LinkType.EXHIBITION:
        sentences.push(`${sName} exhibits ${tName}.`);
        break;
      case LinkType.GENERALIZATION:
        sentences.push(`${tName} is a ${sName}.`);
        break;
      case LinkType.INSTANTIATION:
        sentences.push(`${tName} is an instance of ${sName}.`);
        break;
      case LinkType.AGENT:
        {
          const isSourceProcess = source.type === ElementType.PROCESS;
          const agentEl = isSourceProcess ? target : source;
          const processEl = isSourceProcess ? source : target;
          
          if (processEl.type === ElementType.PROCESS && agentEl.type === ElementType.STATE && agentEl.parentId) {
            const parent = logical.elements.find(p => p.id === agentEl.parentId);
            sentences.push(`${parent?.name || 'unknown'} in state ${agentEl.name} handles ${processEl.name}.`);
          } else {
            const agentName = getElementName(agentEl);
            const processName = getElementName(processEl);
            sentences.push(`${agentName} handles ${processName}.`);
          }
        }
        break;
      case LinkType.INSTRUMENT:
        {
          const isSourceProcess = source.type === ElementType.PROCESS;
          const instrumentEl = isSourceProcess ? target : source;
          const processEl = isSourceProcess ? source : target;

          if (processEl.type === ElementType.PROCESS && instrumentEl.type === ElementType.STATE && instrumentEl.parentId) {
            const parent = logical.elements.find(p => p.id === instrumentEl.parentId);
            sentences.push(`${processEl.name} requires ${parent?.name || 'unknown'} in state ${instrumentEl.name}.`);
          } else {
            const instName = getElementName(instrumentEl);
            const processName = getElementName(processEl);
            sentences.push(`${processName} requires ${instName}.`);
          }
        }
        break;
      case LinkType.CONSUMPTION:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = logical.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} consumes ${parent?.name} in ${source.name}.`);
        } else {
          sentences.push(`${tName} consumes ${sName}.`);
        }
        break;
      case LinkType.RESULT:
        if (source.type === ElementType.PROCESS && target.type === ElementType.STATE && target.parentId) {
          const parent = logical.elements.find(p => p.id === target.parentId);
          sentences.push(`${source.name} yields ${parent?.name} in ${target.name}.`);
        } else {
          sentences.push(`${sName} yields ${tName}.`);
        }
        break;
      case LinkType.EFFECT:
        if (source.type === ElementType.PROCESS && target.type === ElementType.STATE && target.parentId) {
          const parent = logical.elements.find(p => p.id === target.parentId);
          sentences.push(`${source.name} affects ${parent?.name} in ${target.name}.`);
        } else if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = logical.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} affects ${parent?.name} in ${source.name}.`);
        } else {
          sentences.push(`${sName} affects ${tName}.`);
        }
        break;
      case LinkType.CONDITION:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = logical.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} happens if ${parent?.name} is ${source.name}.`);
        } else {
          sentences.push(`${tName} happens if ${sName} exists.`);
        }
        break;
      case LinkType.EVENT:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = logical.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} happens when ${parent?.name} becomes ${source.name}.`);
        } else {
          sentences.push(`${tName} happens when ${sName} exists.`);
        }
        break;
      case LinkType.EXCEPTION:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = logical.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} happens if ${parent?.name} is not ${source.name}.`);
        } else {
          sentences.push(`${tName} happens if ${sName} does not exist.`);
        }
        break;
      case LinkType.INVOCATION:
        sentences.push(`${sName} invokes ${tName}.`);
        break;
    }
  });

  return sentences;
}
