import { OPMModel, TagDefinition, VisualTagStyle, VisualLink } from '../types';
import { synthesizeDiagramsFromLogical } from './diagramSynthesisService';

/**
 * Normalizes an OPM model to guarantee strict separation of concerns:
 * 1. Logical Model (model.logical): Pure system ontology (elements, links, structural tag types).
 *    Contains zero visual styling, colors, coordinates, or diagram label visibilities.
 * 2. Visual Model (opd.visual): Diagrammatic representation in the canvas.
 *    Contains element geometry, link anchors, per-link label visibility overrides,
 *    and visual tag styles (stroke colors, line styles, default diagram badge visibility).
 */
export function normalizeOPMModel(rawModel: any): OPMModel {
  if (!rawModel || typeof rawModel !== 'object') {
    return rawModel;
  }

  const legacyTags: any[] = rawModel.logical?.tags || rawModel.logicalModel?.tags || [];
  
  // Extract clean logical tag definitions (pure ontology)
  const cleanLogicalTags: TagDefinition[] = legacyTags.map(t => ({
    id: t.id || t.name,
    name: t.name || t.id
  }));

  // Build default visual tag styles extracted from any legacy tag definitions
  const legacyVisualStyles: VisualTagStyle[] = legacyTags
    .filter(t => t.color || t.lineStyle || t.showTagLabel !== undefined)
    .map(t => ({
      tag: t.name,
      color: t.color || '#2563eb',
      lineStyle: t.lineStyle || 'solid',
      showTagLabel: t.showTagLabel !== false
    }));

  // Clean logical links (strip visual properties if present)
  const cleanLogicalLinks = (rawModel.logical?.links || rawModel.logicalModel?.links || []).map((l: any) => {
    const { showTagLabel, ...logicalOnly } = l;
    return logicalOnly;
  });

  const cleanLogicalElements = rawModel.logical?.elements || rawModel.logicalModel?.elements || [];

  // Normalize OPDs
  let opds = (rawModel.opds || rawModel.diagrams || []).map((opd: any) => {
    const existingTagStyles: VisualTagStyle[] = opd.visual?.tagStyles ? [...opd.visual.tagStyles] : (opd.visualRepresentation?.tagStyles || []);

    // Merge any missing visual styles from legacy tags
    legacyVisualStyles.forEach(lvs => {
      if (!existingTagStyles.some(ts => ts.tag.toLowerCase() === lvs.tag.toLowerCase())) {
        existingTagStyles.push(lvs);
      }
    });

    const rawVisualLinks = opd.visual?.links || opd.visualRepresentation?.links || [];
    // Normalize visual links to preserve any per-link label visibility overrides
    const visualLinks: VisualLink[] = rawVisualLinks.map((vl: any) => {
      const correspondingLogical = cleanLogicalLinks.find((l: any) => l.id === vl.id);
      const showTagLabel = vl.showTagLabel !== undefined 
        ? vl.showTagLabel 
        : (correspondingLogical?.showTagLabel !== undefined ? correspondingLogical.showTagLabel : undefined);

      const cleanVl: VisualLink = {
        id: vl.id,
        sourceAnchor: vl.sourceAnchor,
        targetAnchor: vl.targetAnchor,
      };
      if (showTagLabel !== undefined) {
        cleanVl.showTagLabel = showTagLabel;
      }
      return cleanVl;
    });

    return {
      id: opd.id,
      name: opd.name || 'SD',
      parentProcessId: opd.parentProcessId,
      visual: {
        elements: opd.visual?.elements || opd.visualRepresentation?.elements || [],
        links: visualLinks,
        tagStyles: existingTagStyles
      }
    };
  });

  let currentOpdId = rawModel.currentOpdId;

  // Fallback: If no OPDs exist but logical model elements are present, synthesize diagrams
  if (opds.length === 0 && cleanLogicalElements.length > 0) {
    const synthesized = synthesizeDiagramsFromLogical({
      elements: cleanLogicalElements,
      links: cleanLogicalLinks,
      tags: cleanLogicalTags
    });
    opds = synthesized.opds;
    currentOpdId = synthesized.currentOpdId;
  }

  return {
    ...rawModel,
    logical: {
      elements: cleanLogicalElements,
      tags: cleanLogicalTags,
      links: cleanLogicalLinks
    },
    opds,
    currentOpdId: currentOpdId || opds[0]?.id || ''
  };
}
