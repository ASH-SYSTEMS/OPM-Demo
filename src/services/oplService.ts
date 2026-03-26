import { OPMModel, ElementType, LinkType, OPMElement } from '../types';

export function generateOPL(model: OPMModel): string[] {
  const sentences: string[] = [];

  // 1. Describe Elements
  model.elements.forEach(el => {
    if (el.type === ElementType.OBJECT && !el.parentId) {
      sentences.push(`${el.name} is an object.`);
      if (el.isPhysical) sentences.push(`${el.name} is physical.`);
      if (el.isEnvironmental) sentences.push(`${el.name} is environmental.`);
      
      // Describe states
      const states = model.elements.filter(s => s.parentId === el.id && s.type === ElementType.STATE);
      if (states.length > 0) {
        const stateNames = states.map(s => s.name).join(', ');
        sentences.push(`${el.name} can be ${stateNames}.`);
        
        states.forEach(s => {
          if (s.isInitial) sentences.push(`${s.name} of ${el.name} is initial.`);
          if (s.isFinal) sentences.push(`${s.name} of ${el.name} is final.`);
        });
      }
    } else if (el.type === ElementType.PROCESS) {
      if (!el.parentId) {
        sentences.push(`${el.name} is a process.`);
      }
      if (el.isPhysical) sentences.push(`${el.name} is physical.`);
      if (el.isEnvironmental) sentences.push(`${el.name} is environmental.`);
      
      // Describe subprocesses
      const subprocesses = model.elements.filter(s => s.parentId === el.id && s.type === ElementType.PROCESS);
      if (subprocesses.length > 0) {
        const subNames = subprocesses.map(s => s.name).join(', ');
        sentences.push(`${el.name} zooms into ${subNames}.`);
      }
    }
  });

  // 2. Describe Links
  const handledLinkIds = new Set<string>();

  // Special case: State changes (Consumption + Result on same object)
  const getDescendantProcessIds = (processId: string): string[] => {
    const children = model.elements.filter(el => el.parentId === processId && el.type === ElementType.PROCESS);
    let ids = [processId];
    children.forEach(child => {
      ids = [...ids, ...getDescendantProcessIds(child.id)];
    });
    return ids;
  };

  model.elements.filter(el => el.type === ElementType.PROCESS).forEach(process => {
    const descendantIds = getDescendantProcessIds(process.id);
    const incomingConsumption = model.links.filter(l => descendantIds.includes(l.targetId) && l.type === LinkType.CONSUMPTION);
    const outgoingResult = model.links.filter(l => descendantIds.includes(l.sourceId) && l.type === LinkType.RESULT);

    incomingConsumption.forEach(inLink => {
      const sourceState = model.elements.find(e => e.id === inLink.sourceId);
      if (sourceState?.type === ElementType.STATE && sourceState.parentId) {
        const parentObject = model.elements.find(e => e.id === sourceState.parentId);
        
        outgoingResult.forEach(outLink => {
          const targetState = model.elements.find(e => e.id === outLink.targetId);
          if (targetState?.type === ElementType.STATE && targetState.parentId === sourceState.parentId && sourceState.id !== targetState.id) {
            const sentence = `${process.name} changes ${parentObject?.name} from ${sourceState.name} to ${targetState.name}.`;
            if (!sentences.includes(sentence)) {
              sentences.push(sentence);
              // Only mark as handled if it's a direct link to this process
              // to avoid suppressing OPL for subprocesses that also show the link
              if (inLink.targetId === process.id) handledLinkIds.add(inLink.id);
              if (outLink.sourceId === process.id) handledLinkIds.add(outLink.id);
            }
          }
        });
      } else if (sourceState?.type === ElementType.OBJECT) {
        // Case: Process affects the same object (no states)
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

  model.links.forEach(link => {
    if (handledLinkIds.has(link.id)) return;
    
    const source = model.elements.find(e => e.id === link.sourceId);
    const target = model.elements.find(e => e.id === link.targetId);
    if (!source || !target) return;

    const getElementName = (el: OPMElement) => {
      if (el.type === ElementType.STATE && el.parentId) {
        const parent = model.elements.find(p => p.id === el.parentId);
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
        sentences.push(`${sName} is a ${tName}.`);
        break;
      case LinkType.INSTANTIATION:
        sentences.push(`${sName} is an instance of ${tName}.`);
        break;
      case LinkType.AGENT:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} handles ${parent?.name} in ${source.name}.`);
        } else {
          sentences.push(`${tName} handles ${sName}.`);
        }
        break;
      case LinkType.INSTRUMENT:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} requires ${parent?.name} in ${source.name}.`);
        } else {
          sentences.push(`${tName} requires ${sName}.`);
        }
        break;
      case LinkType.CONSUMPTION:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} consumes ${parent?.name} in ${source.name}.`);
        } else {
          sentences.push(`${tName} consumes ${sName}.`);
        }
        break;
      case LinkType.RESULT:
        if (source.type === ElementType.PROCESS && target.type === ElementType.STATE && target.parentId) {
          const parent = model.elements.find(p => p.id === target.parentId);
          sentences.push(`${source.name} yields ${parent?.name} in ${target.name}.`);
        } else {
          sentences.push(`${sName} yields ${tName}.`);
        }
        break;
      case LinkType.EFFECT:
        if (source.type === ElementType.PROCESS && target.type === ElementType.STATE && target.parentId) {
          const parent = model.elements.find(p => p.id === target.parentId);
          sentences.push(`${source.name} affects ${parent?.name} in ${target.name}.`);
        } else if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} affects ${parent?.name} in ${source.name}.`);
        } else {
          sentences.push(`${sName} affects ${tName}.`);
        }
        break;
      case LinkType.CONDITION:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} happens if ${parent?.name} is ${source.name}.`);
        } else {
          sentences.push(`${tName} happens if ${sName} exists.`);
        }
        break;
      case LinkType.EVENT:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} happens when ${parent?.name} becomes ${source.name}.`);
        } else {
          sentences.push(`${tName} happens when ${sName} exists.`);
        }
        break;
      case LinkType.EXCEPTION:
        if (target.type === ElementType.PROCESS && source.type === ElementType.STATE && source.parentId) {
          const parent = model.elements.find(p => p.id === source.parentId);
          sentences.push(`${target.name} happens if ${parent?.name} is not ${source.name}.`);
        } else {
          sentences.push(`${tName} happens if ${sName} does not exist.`);
        }
        break;
    }
  });

  return sentences;
}
