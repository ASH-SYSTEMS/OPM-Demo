import { OPMModel, ElementType, LinkType, OPMElement } from '../types';

export function generateOPL(model: OPMModel): string[] {
  const sentences: string[] = [];

  // 1. Describe Elements
  model.elements.forEach(el => {
    if (el.type === ElementType.OBJECT && !el.parentId) {
      sentences.push(`${el.name} is an object.`);
      
      // Describe states
      const states = model.elements.filter(s => s.parentId === el.id && s.type === ElementType.STATE);
      if (states.length > 0) {
        const stateNames = states.map(s => s.name).join(', ');
        sentences.push(`${el.name} can be ${stateNames}.`);
      }
    } else if (el.type === ElementType.PROCESS && !el.parentId) {
      sentences.push(`${el.name} is a process.`);
      
      // Describe subprocesses
      const subprocesses = model.elements.filter(s => s.parentId === el.id && s.type === ElementType.PROCESS);
      if (subprocesses.length > 0) {
        const subNames = subprocesses.map(s => s.name).join(', ');
        sentences.push(`${el.name} zooms into ${subNames}.`);
      }
    }
  });

  // 2. Describe Links
  model.links.forEach(link => {
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
        sentences.push(`${tName} is a ${sName}.`);
        break;
      case LinkType.INSTANTIATION:
        sentences.push(`${tName} is an instance of ${sName}.`);
        break;
      case LinkType.AGENT:
        sentences.push(`${sName} handles ${tName}.`);
        break;
      case LinkType.INSTRUMENT:
        sentences.push(`${sName} is instrumental to ${tName}.`);
        break;
      case LinkType.CONSUMPTION:
        sentences.push(`${tName} consumes ${sName}.`);
        break;
      case LinkType.RESULT:
        sentences.push(`${sName} yields ${tName}.`);
        break;
      case LinkType.EFFECT:
        sentences.push(`${sName} affects ${tName}.`);
        break;
    }
  });

  return sentences;
}
