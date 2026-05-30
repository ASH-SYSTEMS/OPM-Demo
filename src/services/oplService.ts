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
  
  // Helper to format consistent lists: A, B, and C
  const formatList = (items: string[]): string => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  };

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
      if (el.essence === 'PHYSICAL' && el.affiliation === 'ENVIRONMENTAL') {
        sentences.push(`${el.name} is a physical, environmental object.`);
      } else if (el.essence === 'PHYSICAL') {
        sentences.push(`${el.name} is a physical object.`);
      } else if (el.affiliation === 'ENVIRONMENTAL') {
        sentences.push(`${el.name} is an environmental object.`);
      } else {
        sentences.push(`${el.name} is an object.`);
      }
      
      // Describe states
      const states = visibleElements.filter(s => s.parentId === el.id && s.type === ElementType.STATE);
      if (states.length > 0) {
        const stateNames = formatList(states.map(s => s.name));
        sentences.push(`${el.name} can be ${stateNames}.`);
        
        states.forEach(s => {
          const props: string[] = [];
          if (s.isInitial) props.push('initial');
          if (s.isFinal) props.push('final');
          if (s.isDefault) props.push('default');
          if (props.length > 0) {
            sentences.push(`${s.name} of ${el.name} is ${formatList(props)}.`);
          }
        });
      }
    } else if (el.type === ElementType.PROCESS) {
      if (el.essence === 'PHYSICAL' && el.affiliation === 'ENVIRONMENTAL') {
        sentences.push(`${el.name} is a physical, environmental process.`);
      } else if (el.essence === 'PHYSICAL') {
        sentences.push(`${el.name} is a physical process.`);
      } else if (el.affiliation === 'ENVIRONMENTAL') {
        sentences.push(`${el.name} is an environmental process.`);
      } else {
        sentences.push(`${el.name} is a process.`);
      }
      
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

        const subNames = formatList(sortedSubs.map(s => s.name));
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

    const changesGroup: string[] = [];
    const affectsGroup: string[] = [];
    const localHandledLinkIds = new Set<string>();

    incomingConsumption.forEach(inLink => {
      const sourceState = visibleElements.find(e => e.id === inLink.sourceId);
      if (sourceState?.type === ElementType.STATE && sourceState.parentId) {
        const parentObject = visibleElements.find(e => e.id === sourceState.parentId);
        
        outgoingResult.forEach(outLink => {
          const targetState = visibleElements.find(e => e.id === outLink.targetId);
          if (targetState?.type === ElementType.STATE && targetState.parentId === sourceState.parentId && sourceState.id !== targetState.id) {
            const changeDesc = `${parentObject?.name} from ${sourceState.name} to ${targetState.name}`;
            if (!changesGroup.includes(changeDesc)) {
              changesGroup.push(changeDesc);
              if (inLink.targetId === process.id) localHandledLinkIds.add(inLink.id);
              if (outLink.sourceId === process.id) localHandledLinkIds.add(outLink.id);
            }
          }
        });
      } else if (sourceState?.type === ElementType.OBJECT) {
        outgoingResult.forEach(outLink => {
          if (outLink.targetId === sourceState.id) {
            const affectDesc = sourceState.name;
            if (!affectsGroup.includes(affectDesc)) {
              affectsGroup.push(affectDesc);
              if (inLink.targetId === process.id) localHandledLinkIds.add(inLink.id);
              if (outLink.sourceId === process.id) localHandledLinkIds.add(outLink.id);
            }
          }
        });
      }
    });

    if (changesGroup.length > 0) {
      sentences.push(`${process.name} changes ${formatList(changesGroup)}.`);
      localHandledLinkIds.forEach(id => handledLinkIds.add(id));
    }
    if (affectsGroup.length > 0) {
      sentences.push(`${process.name} affects ${formatList(affectsGroup)}.`);
      localHandledLinkIds.forEach(id => handledLinkIds.add(id));
    }
  });

  const remainingLinks = visibleLinks.filter(l => !handledLinkIds.has(l.id));

  // Helper inside loop for state names etc.
  const getElementName = (el: LogicalElement) => {
    if (el.type === ElementType.STATE && el.parentId) {
      const parent = visibleElements.find(p => p.id === el.parentId);
      return `${el.name} of ${parent?.name || 'unknown'}`;
    }
    return el.name;
  };

  // Group and format remainders

  // 1. AGGREGATION (consists of)
  const aggregationsBySource = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.AGGREGATION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (s && t) {
      const sName = getElementName(s);
      const tName = getElementName(t);
      if (!aggregationsBySource.has(sName)) aggregationsBySource.set(sName, []);
      aggregationsBySource.get(sName)!.push(tName);
    }
  });
  aggregationsBySource.forEach((targets, sourceName) => {
    sentences.push(`${sourceName} consists of ${formatList(targets)}.`);
  });

  // 2. EXHIBITION (exhibits)
  const exhibitionsBySource = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.EXHIBITION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (s && t) {
      const sName = getElementName(s);
      const tName = getElementName(t);
      if (!exhibitionsBySource.has(sName)) exhibitionsBySource.set(sName, []);
      exhibitionsBySource.get(sName)!.push(tName);
    }
  });
  exhibitionsBySource.forEach((targets, sourceName) => {
    sentences.push(`${sourceName} exhibits ${formatList(targets)}.`);
  });

  // 3. GENERALIZATION (is a / are a)
  const generalizationsBySource = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.GENERALIZATION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (s && t) {
      const sName = getElementName(s);
      const tName = getElementName(t);
      if (!generalizationsBySource.has(sName)) generalizationsBySource.set(sName, []);
      generalizationsBySource.get(sName)!.push(tName);
    }
  });
  generalizationsBySource.forEach((targets, sourceName) => {
    if (targets.length === 1) {
      sentences.push(`${targets[0]} is a ${sourceName}.`);
    } else {
      sentences.push(`${formatList(targets)} are a ${sourceName}.`);
    }
  });

  // 4. INSTANTIATION (is an instance of / are instances of)
  const instantiationsBySource = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.INSTANTIATION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (s && t) {
      const sName = getElementName(s);
      const tName = getElementName(t);
      if (!instantiationsBySource.has(sName)) instantiationsBySource.set(sName, []);
      instantiationsBySource.get(sName)!.push(tName);
    }
  });
  instantiationsBySource.forEach((targets, sourceName) => {
    if (targets.length === 1) {
      sentences.push(`${targets[0]} is an instance of ${sourceName}.`);
    } else {
      sentences.push(`${formatList(targets)} are instances of ${sourceName}.`);
    }
  });

  // 5. AGENT (handles)
  const agentsMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.AGENT).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const isSourceProcess = s.type === ElementType.PROCESS;
    const agentEl = isSourceProcess ? t : s;
    const processEl = isSourceProcess ? s : t;

    if (processEl.type === ElementType.PROCESS) {
      let agentDesc = '';
      if (agentEl.type === ElementType.STATE && agentEl.parentId) {
        const parent = visibleElements.find(p => p.id === agentEl.parentId);
        agentDesc = `${parent?.name || 'unknown'} in state ${agentEl.name}`;
      } else {
        agentDesc = getElementName(agentEl);
      }
      
      const processName = getElementName(processEl);
      if (!agentsMap.has(agentDesc)) agentsMap.set(agentDesc, []);
      agentsMap.get(agentDesc)!.push(processName);
    }
  });
  agentsMap.forEach((processes, agentDesc) => {
    sentences.push(`${agentDesc} handles ${formatList(processes)}.`);
  });

  // 6. INSTRUMENT (requires)
  const instrumentsMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.INSTRUMENT).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const isSourceProcess = s.type === ElementType.PROCESS;
    const instrumentEl = isSourceProcess ? t : s;
    const processEl = isSourceProcess ? s : t;

    if (processEl.type === ElementType.PROCESS) {
      let instDesc = '';
      if (instrumentEl.type === ElementType.STATE && instrumentEl.parentId) {
        const parent = visibleElements.find(p => p.id === instrumentEl.parentId);
        instDesc = `${parent?.name || 'unknown'} in state ${instrumentEl.name}`;
      } else {
        instDesc = getElementName(instrumentEl);
      }

      const processName = getElementName(processEl);
      if (!instrumentsMap.has(processName)) instrumentsMap.set(processName, []);
      instrumentsMap.get(processName)!.push(instDesc);
    }
  });
  instrumentsMap.forEach((instruments, processName) => {
    sentences.push(`${processName} requires ${formatList(instruments)}.`);
  });

  // 7. CONSUMPTION (consumes)
  const consumptionMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.CONSUMPTION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const processEl = t;
    const consumedEl = s;

    if (processEl.type === ElementType.PROCESS) {
      let consumeDesc = '';
      if (consumedEl.type === ElementType.STATE && consumedEl.parentId) {
        const parent = visibleElements.find(p => p.id === consumedEl.parentId);
        consumeDesc = `${parent?.name || 'unknown'} in ${consumedEl.name}`;
      } else {
        consumeDesc = getElementName(consumedEl);
      }

      const processName = getElementName(processEl);
      if (!consumptionMap.has(processName)) consumptionMap.set(processName, []);
      consumptionMap.get(processName)!.push(consumeDesc);
    }
  });
  consumptionMap.forEach((consumes, processName) => {
    sentences.push(`${processName} consumes ${formatList(consumes)}.`);
  });

  // 8. RESULT (yields)
  const resultMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.RESULT).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const processEl = s;
    const yieldEl = t;

    if (processEl.type === ElementType.PROCESS) {
      let yieldDesc = '';
      if (yieldEl.type === ElementType.STATE && yieldEl.parentId) {
        const parent = visibleElements.find(p => p.id === yieldEl.parentId);
        yieldDesc = `${parent?.name || 'unknown'} in ${yieldEl.name}`;
      } else {
        yieldDesc = getElementName(yieldEl);
      }

      const processName = getElementName(processEl);
      if (!resultMap.has(processName)) resultMap.set(processName, []);
      resultMap.get(processName)!.push(yieldDesc);
    }
  });
  resultMap.forEach((yields, processName) => {
    sentences.push(`${processName} yields ${formatList(yields)}.`);
  });

  // 9. EFFECT (affects)
  const effectMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.EFFECT).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    let processEl: LogicalElement | undefined;
    let otherEl: LogicalElement | undefined;

    if (s.type === ElementType.PROCESS) {
      processEl = s;
      otherEl = t;
    } else if (t.type === ElementType.PROCESS) {
      processEl = t;
      otherEl = s;
    }

    if (processEl && otherEl) {
      let effectDesc = '';
      if (otherEl.type === ElementType.STATE && otherEl.parentId) {
        const parent = visibleElements.find(p => p.id === otherEl.parentId);
        effectDesc = `${parent?.name || 'unknown'} in ${otherEl.name}`;
      } else {
        effectDesc = getElementName(otherEl);
      }

      const processName = getElementName(processEl);
      if (!effectMap.has(processName)) effectMap.set(processName, []);
      effectMap.get(processName)!.push(effectDesc);
    }
  });
  effectMap.forEach((effects, processName) => {
    sentences.push(`${processName} affects ${formatList(effects)}.`);
  });

  // 10. CONDITION (happens if)
  const conditionMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.CONDITION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const processEl = t;
    const conditionEl = s;

    if (processEl.type === ElementType.PROCESS) {
      let condDesc = '';
      if (conditionEl.type === ElementType.STATE && conditionEl.parentId) {
        const parent = visibleElements.find(p => p.id === conditionEl.parentId);
        condDesc = `${parent?.name || 'unknown'} is ${conditionEl.name}`;
      } else {
        condDesc = `${getElementName(conditionEl)} exists`;
      }

      const processName = getElementName(processEl);
      if (!conditionMap.has(processName)) conditionMap.set(processName, []);
      conditionMap.get(processName)!.push(condDesc);
    }
  });
  conditionMap.forEach((conditions, processName) => {
    sentences.push(`${processName} happens if ${formatList(conditions)}.`);
  });

  // 11. EVENT (happens when)
  const eventMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.EVENT).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const processEl = t;
    const eventEl = s;

    if (processEl.type === ElementType.PROCESS) {
      let eventDesc = '';
      if (eventEl.type === ElementType.STATE && eventEl.parentId) {
        const parent = visibleElements.find(p => p.id === eventEl.parentId);
        eventDesc = `${parent?.name || 'unknown'} becomes ${eventEl.name}`;
      } else {
        eventDesc = `${getElementName(eventEl)} exists`;
      }

      const processName = getElementName(processEl);
      if (!eventMap.has(processName)) eventMap.set(processName, []);
      eventMap.get(processName)!.push(eventDesc);
    }
  });
  eventMap.forEach((events, processName) => {
    sentences.push(`${processName} happens when ${formatList(events)}.`);
  });

  // 12. EXCEPTION (happens if ... does not exist / is not)
  const exceptionMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.EXCEPTION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (!s || !t) return;

    const processEl = t;
    const exceptionEl = s;

    if (processEl.type === ElementType.PROCESS) {
      let excDesc = '';
      if (exceptionEl.type === ElementType.STATE && exceptionEl.parentId) {
        const parent = visibleElements.find(p => p.id === exceptionEl.parentId);
        excDesc = `${parent?.name || 'unknown'} is not ${exceptionEl.name}`;
      } else {
        excDesc = `${getElementName(exceptionEl)} does not exist`;
      }

      const processName = getElementName(processEl);
      if (!exceptionMap.has(processName)) exceptionMap.set(processName, []);
      exceptionMap.get(processName)!.push(excDesc);
    }
  });
  exceptionMap.forEach((exceptions, processName) => {
    sentences.push(`${processName} happens if ${formatList(exceptions)}.`);
  });

  // 13. INVOCATION (invokes)
  const invocationMap = new Map<string, string[]>();
  remainingLinks.filter(l => l.type === LinkType.INVOCATION).forEach(link => {
    const s = visibleElements.find(e => e.id === link.sourceId);
    const t = visibleElements.find(e => e.id === link.targetId);
    if (s && t) {
      const sName = getElementName(s);
      const tName = getElementName(t);
      if (!invocationMap.has(sName)) invocationMap.set(sName, []);
      invocationMap.get(sName)!.push(tName);
    }
  });
  invocationMap.forEach((targets, sName) => {
    sentences.push(`${sName} invokes ${formatList(targets)}.`);
  });

  return sentences;
}
