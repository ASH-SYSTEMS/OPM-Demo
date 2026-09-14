/**
 * OPM-Pro Application Component
 * Copyright (c) 2026 Avi Shaked. All rights reserved.
 * Permissive use granted with proper attribution to Avi Shaked.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Group, Arrow, Circle as KonvaCircle, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Square, 
  Circle, 
  ArrowRight, 
  Trash2, 
  FileText, 
  Settings,
  Download,
  Share2,
  MousePointer2,
  Type as TypeIcon,
  Layers,
  HelpCircle,
  Library,
  Zap,
  X,
  AlertTriangle,
  ChevronRight,
  ArrowUpLeft,
  Maximize2,
  Check,
  Undo,
  Redo,
  Sparkles,
  Tag,
  GraduationCap,
  Edit3
} from 'lucide-react';
import { 
  ElementType, 
  LinkType, 
  LogicalElement, 
  VisualElement, 
  LogicalLink, 
  VisualLink, 
  OPMModel,
  Essence,
  Affiliation,
  OPD,
  TagDefinition,
  VisualTagStyle,
  TagLineStyle
} from './types';
import { generateOPL } from './services/oplService';
import { normalizeOPMModel } from './services/modelMigration';
import { 
  analyzeModelHierarchy, 
  synthesizeDiagramsFromLogical, 
  type ModelHierarchyInfo 
} from './services/diagramSynthesisService';
import { OPM_EXAMPLES } from './constants/examples';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import HelpModal from './components/HelpModal';
import OPMIcon from './components/OPMIcon';
import TutorialOverlay from './components/TutorialOverlay';
import { TUTORIAL_STEPS } from './constants/tutorial';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const initialOpdId = uuidv4();
  const [model, setModel] = useState<OPMModel>(() => {
    return {
      logical: { elements: [], links: [], tags: [] },
      opds: [{
        id: initialOpdId,
        name: 'SD',
        visual: { elements: [], links: [], tagStyles: [] }
      }],
      currentOpdId: initialOpdId
    };
  });
  const [history, setHistory] = useState<OPMModel[]>([]);
  const [redoHistory, setRedoHistory] = useState<OPMModel[]>([]);

  const pushToHistory = () => {
    setHistory(prev => {
      const newHistory = [...prev, model];
      // Limit history to 50 steps
      if (newHistory.length > 50) return newHistory.slice(1);
      return newHistory;
    });
    setRedoHistory([]);
  };

  const updateModel = (newModel: OPMModel | ((prev: OPMModel) => OPMModel)) => {
    pushToHistory();
    setModel(newModel);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previousModel = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setRedoHistory(prev => [...prev, model]);
    setModel(previousModel);
    setSelectedId(null);
    setSelectedLinkId(null);
  };

  const redo = () => {
    if (redoHistory.length === 0) return;
    const nextModel = redoHistory[redoHistory.length - 1];
    setRedoHistory(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, model]);
    setModel(nextModel);
    setSelectedId(null);
    setSelectedLinkId(null);
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'procedural' | ElementType | LinkType>('select');
  const [linkingSource, setLinkingSource] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 400, height: window.innerHeight - 64 });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExampleLibraryOpen, setIsExampleLibraryOpen] = useState(false);
  const [oplMode, setOplMode] = useState<'diagram' | 'full'>('diagram');
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const [addExistingTab, setAddExistingTab] = useState<'elements' | 'links'>('elements');
  const [selectedAddExistingIds, setSelectedAddExistingIds] = useState<string[]>([]);

  // Tagged Structural Link Dialog & Styling State
  interface TaggedLinkDialogState {
    isOpen: boolean;
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
  }
  const [taggedLinkDialog, setTaggedLinkDialog] = useState<TaggedLinkDialogState | null>(null);
  const [selectedTagInput, setSelectedTagInput] = useState<string>('supports');
  const [newTagColor, setNewTagColor] = useState<string>('#2563eb');
  const [newTagLineStyle, setNewTagLineStyle] = useState<TagLineStyle>('solid');
  const [newTagShowLabel, setNewTagShowLabel] = useState<boolean>(true);

  const handleConfirmTaggedLink = (tagName: string, color?: string, lineStyle?: TagLineStyle, showLabel?: boolean) => {
    if (!taggedLinkDialog) return;
    const cleanTag = tagName.trim() || 'supports';
    const linkId = uuidv4();

    const existingTags = model.logical.tags || [];
    const existingDef = existingTags.find(t => t.name.toLowerCase() === cleanTag.toLowerCase());

    let updatedTags = [...existingTags];
    if (!existingDef) {
      updatedTags.push({
        id: uuidv4(),
        name: cleanTag
      });
    }

    const newLogical: LogicalLink = {
      id: linkId,
      type: LinkType.TAGGED_STRUCTURAL,
      sourceId: taggedLinkDialog.sourceId,
      targetId: taggedLinkDialog.targetId,
      tag: existingDef ? existingDef.name : cleanTag
    };
    const newVisual: VisualLink = {
      id: linkId,
      showTagLabel: showLabel !== undefined ? showLabel : undefined
    };

    updateModel(prev => {
      const currentOpd = prev.opds.find(o => o.id === prev.currentOpdId);
      const existingTagStyles = currentOpd?.visual.tagStyles || [];
      const hasStyle = existingTagStyles.some(ts => ts.tag.toLowerCase() === cleanTag.toLowerCase());

      const updatedTagStyles = hasStyle
        ? existingTagStyles
        : [...existingTagStyles, {
            tag: cleanTag,
            color: color || newTagColor || '#2563eb',
            lineStyle: lineStyle || newTagLineStyle || 'solid',
            showTagLabel: showLabel !== undefined ? showLabel : newTagShowLabel
          }];

      return {
        ...prev,
        logical: {
          ...prev.logical,
          tags: updatedTags,
          links: [...prev.logical.links, newLogical]
        },
        opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
          ...o,
          visual: {
            ...o.visual,
            links: [...o.visual.links, newVisual],
            tagStyles: updatedTagStyles
          }
        } : o)
      };
    });

    setSelectedLinkId(linkId);
    setSelectedId(null);
    setTaggedLinkDialog(null);
    setTool('select');
  };

  const updateTagVisual = (tagName: string, updates: Partial<VisualTagStyle>) => {
    updateModel(prev => ({
      ...prev,
      opds: prev.opds.map(o => {
        if (o.id !== prev.currentOpdId) return o;
        const existingTagStyles = o.visual.tagStyles || [];
        const idx = existingTagStyles.findIndex(ts => ts.tag.toLowerCase() === tagName.toLowerCase());
        let newTagStyles: VisualTagStyle[];
        if (idx >= 0) {
          newTagStyles = [...existingTagStyles];
          newTagStyles[idx] = { ...newTagStyles[idx], ...updates };
        } else {
          newTagStyles = [
            ...existingTagStyles,
            {
              tag: tagName,
              color: '#2563eb',
              lineStyle: 'solid' as TagLineStyle,
              showTagLabel: true,
              ...updates
            }
          ];
        }
        return {
          ...o,
          visual: {
            ...o.visual,
            tagStyles: newTagStyles
          }
        };
      })
    }));
  };

  const setAllLinksTagVisibility = (tagName: string, showLabel: boolean) => {
    updateModel(prev => ({
      ...prev,
      opds: prev.opds.map(o => {
        if (o.id !== prev.currentOpdId) return o;
        const existingTagStyles = o.visual.tagStyles || [];
        const idx = existingTagStyles.findIndex(ts => ts.tag.toLowerCase() === tagName.toLowerCase());
        let newTagStyles: VisualTagStyle[];
        if (idx >= 0) {
          newTagStyles = [...existingTagStyles];
          newTagStyles[idx] = { ...newTagStyles[idx], showTagLabel: showLabel };
        } else {
          newTagStyles = [
            ...existingTagStyles,
            {
              tag: tagName,
              color: '#2563eb',
              lineStyle: 'solid' as TagLineStyle,
              showTagLabel: showLabel
            }
          ];
        }
        // Reset per-link override for links with this tag in this OPD so they all adhere to the global setting
        const updatedVisualLinks = o.visual.links.map(vl => {
          const logical = prev.logical.links.find(l => l.id === vl.id);
          if (logical?.type === LinkType.TAGGED_STRUCTURAL && logical.tag?.toLowerCase() === tagName.toLowerCase()) {
            const { showTagLabel: _, ...rest } = vl;
            return rest;
          }
          return vl;
        });
        return {
          ...o,
          visual: {
            ...o.visual,
            links: updatedVisualLinks,
            tagStyles: newTagStyles
          }
        };
      })
    }));
  };

  // Global Tag Renaming & Tag Management State
  const [renameTagModal, setRenameTagModal] = useState<{
    isOpen: boolean;
    oldTag: string;
    initialNewTag?: string;
  } | null>(null);
  const [renameInputVal, setRenameInputVal] = useState('');
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const renameTagGlobally = (oldTag: string, newTag: string) => {
    const cleanOld = oldTag.trim();
    const cleanNew = newTag.trim();
    if (!cleanOld || !cleanNew) return;
    if (cleanOld.toLowerCase() === cleanNew.toLowerCase()) {
      if (cleanOld === cleanNew) return;
    }

    pushToHistory();

    const matchingRelationsCount = model.logical.links.filter(
      l => l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim().toLowerCase() === cleanOld.toLowerCase()
    ).length;

    updateModel(prev => {
      const existingTags = prev.logical.tags || [];
      const targetTagAlreadyExists = existingTags.some(t => t.name.toLowerCase() === cleanNew.toLowerCase());

      let updatedTags: TagDefinition[];
      if (targetTagAlreadyExists) {
        // Target tag definition already exists; remove old tag to avoid duplicate definitions
        updatedTags = existingTags.filter(t => t.name.toLowerCase() !== cleanOld.toLowerCase());
      } else {
        const oldIndex = existingTags.findIndex(t => t.name.toLowerCase() === cleanOld.toLowerCase());
        if (oldIndex >= 0) {
          updatedTags = existingTags.map((t, idx) => idx === oldIndex ? { ...t, name: cleanNew } : t);
        } else {
          updatedTags = [...existingTags, { id: uuidv4(), name: cleanNew }];
        }
      }

      // Rename tag on all logical links matching cleanOld
      const updatedLinks = prev.logical.links.map(l => {
        if (l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim().toLowerCase() === cleanOld.toLowerCase()) {
          return { ...l, tag: cleanNew };
        }
        return l;
      });

      // Update opds visual tagStyles across all diagrams
      const updatedOpds = prev.opds.map(opd => {
        const existingStyles = opd.visual.tagStyles || [];
        const oldStyleIndex = existingStyles.findIndex(ts => ts.tag.toLowerCase() === cleanOld.toLowerCase());
        if (oldStyleIndex === -1) {
          return opd;
        }
        const targetStyleIndex = existingStyles.findIndex(ts => ts.tag.toLowerCase() === cleanNew.toLowerCase());
        let newStyles: VisualTagStyle[];
        if (targetStyleIndex >= 0) {
          // cleanNew already has its own visual style in this diagram; drop oldStyle
          newStyles = existingStyles.filter((_, idx) => idx !== oldStyleIndex);
        } else {
          // Transfer this diagram's styling to cleanNew
          newStyles = existingStyles.map((ts, idx) => idx === oldStyleIndex ? { ...ts, tag: cleanNew } : ts);
        }
        return {
          ...opd,
          visual: {
            ...opd.visual,
            tagStyles: newStyles
          }
        };
      });

      return {
        ...prev,
        logical: {
          ...prev.logical,
          tags: updatedTags,
          links: updatedLinks
        },
        opds: updatedOpds
      };
    });

    setToastMessage(`Renamed tag "${cleanOld}" to "${cleanNew}" in ${matchingRelationsCount} relation${matchingRelationsCount === 1 ? '' : 's'}.`);
    setRenameTagModal(null);
  };

  const deleteTagGlobally = (tagName: string) => {
    const clean = tagName.trim();
    if (!clean) return;
    pushToHistory();
    updateModel(prev => ({
      ...prev,
      logical: {
        ...prev.logical,
        tags: (prev.logical.tags || []).filter(t => t.name.toLowerCase() !== clean.toLowerCase()),
        links: prev.logical.links.map(l => {
          if (l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim().toLowerCase() === clean.toLowerCase()) {
            return { ...l, tag: 'relates to' };
          }
          return l;
        })
      },
      opds: prev.opds.map(opd => ({
        ...opd,
        visual: {
          ...opd.visual,
          tagStyles: (opd.visual.tagStyles || []).filter(ts => ts.tag.toLowerCase() !== clean.toLowerCase())
        }
      }))
    }));
    setToastMessage(`Removed tag "${clean}".`);
  };

  // Tutorial State Definitions
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [tutorialBackup, setTutorialBackup] = useState<OPMModel | null>(null);

  // Start the step-by-step tutorial walkthrough
  const startTutorialIndex = () => {
    setTutorialBackup(model);
    setIsTutorialActive(true);
    setCurrentTutorialStep(0);
    setModel(normalizeOPMModel(TUTORIAL_STEPS[0].modelState));
    setSelectedId(null);
    setSelectedLinkId(null);
    setTool('select');
  };

  const handleNextTutorialStep = () => {
    if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentTutorialStep + 1;
      setCurrentTutorialStep(nextStep);
      const step = TUTORIAL_STEPS[nextStep];
      setModel(normalizeOPMModel(step.modelState));
      setSelectedId(step.selectedId);
      setSelectedLinkId(step.selectedLinkId);
      setTool(step.activeTool);
      if (nextStep === TUTORIAL_STEPS.length - 1) {
        setOplMode('full');
      }
    }
  };

  const handlePrevTutorialStep = () => {
    if (currentTutorialStep > 0) {
      const prevStep = currentTutorialStep - 1;
      setCurrentTutorialStep(prevStep);
      const step = TUTORIAL_STEPS[prevStep];
      setModel(normalizeOPMModel(step.modelState));
      setSelectedId(step.selectedId);
      setSelectedLinkId(step.selectedLinkId);
      setTool(step.activeTool);
      if (prevStep < TUTORIAL_STEPS.length - 1) {
        setOplMode('diagram');
      }
    }
  };

  const handleSkipTutorial = () => {
    if (tutorialBackup) {
      setModel(tutorialBackup);
    }
    setIsTutorialActive(false);
    setCurrentTutorialStep(0);
    setSelectedId(null);
    setSelectedLinkId(null);
    setTool('select');
  };

  const handleFinishTutorial = (keepModel: boolean) => {
    if (!keepModel && tutorialBackup) {
      setModel(tutorialBackup);
    }
    setIsTutorialActive(false);
    setCurrentTutorialStep(0);
    setSelectedId(null);
    setSelectedLinkId(null);
    setTool('select');
  };
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    showSecondary?: boolean;
    secondaryLabel?: string;
    onSecondary?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [infoModelPrompt, setInfoModelPrompt] = useState<{
    isOpen: boolean;
    logical: {
      elements: LogicalElement[];
      links: LogicalLink[];
      tags?: TagDefinition[];
    };
    hierarchy: ModelHierarchyInfo;
    fileName?: string;
  } | null>(null);

  const stageRef = useRef<any>(null);

  const currentOpd = model.opds.find(o => o.id === model.currentOpdId) || model.opds[0];

  const zoomIn = (processId: string) => {
    const process = model.logical.elements.find(e => e.id === processId);
    if (!process || process.type !== ElementType.PROCESS) return;

    let existingOpd = model.opds.find(o => o.parentProcessId === processId);
    if (!existingOpd) {
      const newOpdId = uuidv4();
      const newOpd: OPD = {
        id: newOpdId,
        name: `${process.name} in-zoomed`,
        parentProcessId: processId,
        visual: { 
          elements: [{ id: processId, x: 50, y: 50, width: 600, height: 400 }], 
          links: [] 
        }
      };
      updateModel(prev => ({
        ...prev,
        opds: [...prev.opds, newOpd],
        currentOpdId: newOpdId
      }));
    } else {
      setModel(prev => ({
        ...prev,
        currentOpdId: existingOpd!.id
      }));
    }
    setSelectedId(null);
    setSelectedLinkId(null);
  };

  const addExistingLink = (linkId: string) => {
    if (currentOpd.visual.links.some(l => l.id === linkId)) return;
    
    updateModel(prev => ({
      ...prev,
      opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
        ...o,
        visual: {
          ...o.visual,
          links: [...o.visual.links, { id: linkId }]
        }
      } : o)
    }));
  };

  const toggleAddExistingSelection = (id: string) => {
    setSelectedAddExistingIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAddExisting = () => {
    if (addExistingTab === 'elements') {
      const elementIds = selectedAddExistingIds;
      const existingVisualElementIds = currentOpd.visual.elements.map(e => e.id);
      const targetIdsToCheck = [...new Set([...existingVisualElementIds, ...elementIds, currentOpd.parentProcessId].filter(Boolean) as string[])];
      const existingVisualLinkIds = currentOpd.visual.links.map(l => l.id);
      
      const logicalLinksToImport = model.logical.links.filter(l => 
        !existingVisualLinkIds.includes(l.id) && 
        targetIdsToCheck.includes(l.sourceId) && 
        targetIdsToCheck.includes(l.targetId) &&
        (elementIds.includes(l.sourceId) || elementIds.includes(l.targetId))
      );

      const performBulkAdd = (linksToImport: LogicalLink[]) => {
        const newVisualLinks: VisualLink[] = linksToImport.map(l => ({ id: l.id }));
        const newVisualElements: VisualElement[] = elementIds
          .filter(id => !existingVisualElementIds.includes(id))
          .map((id, index) => ({
            id,
            x: 100 + (index * 20),
            y: 100 + (index * 20),
            width: 120,
            height: 60,
            parentId: currentOpd.parentProcessId
          }));

        updateModel(prev => ({
          ...prev,
          logical: {
            ...prev.logical,
            elements: prev.logical.elements.map(el => 
              elementIds.includes(el.id) && !el.parentId && currentOpd.parentProcessId 
                ? { ...el, parentId: currentOpd.parentProcessId } 
                : el
            )
          },
          opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
            ...o,
            visual: {
              ...o.visual,
              elements: [...o.visual.elements, ...newVisualElements],
              links: [...o.visual.links, ...newVisualLinks]
            }
          } : o)
        }));
        setIsAddExistingOpen(false);
        setSelectedAddExistingIds([]);
      };

      if (logicalLinksToImport.length > 0) {
        setDialog({
          isOpen: true,
          title: "Import Relations",
          message: `Found ${logicalLinksToImport.length} existing relations for the selected elements. Import them?`,
          confirmLabel: "Import",
          cancelLabel: "Skip",
          onConfirm: () => {
            performBulkAdd(logicalLinksToImport);
            setDialog(prev => ({ ...prev, isOpen: false }));
          },
          onCancel: () => {
            performBulkAdd([]);
            setDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        performBulkAdd([]);
      }
    } else {
      const linkIds = selectedAddExistingIds;
      updateModel(prev => ({
        ...prev,
        opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
          ...o,
          visual: {
            ...o.visual,
            links: [...o.visual.links, ...linkIds.map(id => ({ id }))]
          }
        } : o)
      }));
      setIsAddExistingOpen(false);
      setSelectedAddExistingIds([]);
    }
  };

  const autoLayout = () => {
    const visualElements = currentOpd.visual.elements;
    if (visualElements.length === 0) return;

    // Filter elements in the current OPD
    const currentElements = model.logical.elements.filter(el => 
      visualElements.some(ve => ve.id === el.id)
    );
    const currentLinks = model.logical.links.filter(l => 
      currentOpd.visual.links.some(vl => vl.id === l.id)
    );

    // Group elements by parentId to layout children nested inside their parents
    // Identify top-level elements for this view (not nested inside other visual elements in the current OPD layout)
    const topLevelElements = currentElements.filter(el => 
      !el.parentId || !visualElements.some(ve => ve.id === el.parentId)
    );

    // Perform ranking on top-level elements to resolve neat vertical tiers
    let levels: Record<string, number> = {};
    topLevelElements.forEach(el => {
      levels[el.id] = 0;
    });

    // Solve for hierarchical layout using refinement passes on link dependencies
    for (let pass = 0; pass < 5; pass++) {
      currentLinks.forEach(link => {
        const sId = link.sourceId;
        const tId = link.targetId;
        
        // Find top-level ancestors if these elements are nested
        const getTopLevelId = (id: string): string => {
          const el = currentElements.find(e => e.id === id);
          if (el && el.parentId && visualElements.some(ve => ve.id === el.parentId)) {
            return getTopLevelId(el.parentId);
          }
          return id;
        };

        const sTopId = getTopLevelId(sId);
        const tTopId = getTopLevelId(tId);

        if (sTopId !== tTopId && levels[sTopId] !== undefined && levels[tTopId] !== undefined) {
          if (levels[tTopId] <= levels[sTopId]) {
            levels[tTopId] = levels[sTopId] + 1;
          }
        }
      });
    }

    // Group elements by their computed tier level
    const levelGroups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(id);
    });

    const levelKeys = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    const startY = currentOpd.parentProcessId ? 110 : 80;
    const levelSpacingY = 160;
    const itemSpacingX = 185;
    const viewWidth = Math.max(800, stageSize.width);

    // Build map of new positions
    const newPositions: Record<string, { x: number, y: number, width: number, height: number }> = {};

    levelKeys.forEach((lvl, rowIdx) => {
      const ids = levelGroups[lvl];
      const rowY = startY + rowIdx * levelSpacingY;
      const totalRowWidth = (ids.length - 1) * itemSpacingX;
      const startX = Math.max(80, (viewWidth - totalRowWidth) / 2);

      ids.forEach((id, colIdx) => {
        const el = currentElements.find(e => e.id === id);
        if (!el) return;

        const visualEl = visualElements.find(ve => ve.id === id);
        let w = visualEl?.width || (el.type === ElementType.OBJECT ? 120 : 140);
        let h = visualEl?.height || (el.type === ElementType.OBJECT ? 60 : 70);

        // If it is the boundary parent process of this OPD, keep its position centered and large
        if (id === currentOpd.parentProcessId) {
          w = 640;
          h = 440;
          newPositions[id] = {
            x: Math.max(50, (viewWidth - w) / 2),
            y: 50,
            width: w,
            height: h
          };
          return;
        }

        const posX = startX + colIdx * itemSpacingX - w / 2;
        newPositions[id] = {
          x: Math.max(40, posX),
          y: rowY,
          width: w,
          height: h
        };
      });
    });

    // Helper: Position layout elements recursively
    const layoutNestedChildren = (parentId: string, parentType: ElementType) => {
      const directChildren = currentElements.filter(child => child.parentId === parentId);
      if (directChildren.length === 0) return;

      const parentVis = newPositions[parentId];
      if (!parentVis) return;

      if (parentType === ElementType.OBJECT) {
        // States inside Object: lay out horizontally in a clean row
        const numStates = directChildren.length;
        const padding = 15;
        const stateWidth = 65;
        const stateHeight = 30;
        
        const reqWidth = numStates * (stateWidth + 15) + padding;
        if (reqWidth > parentVis.width) {
          parentVis.width = reqWidth + 10;
        }
        
        const spacingX = (parentVis.width - padding * 2) / numStates;
        
        directChildren.forEach((child, idx) => {
          const childX = padding + idx * spacingX + (spacingX - stateWidth) / 2;
          const childY = (parentVis.height - stateHeight) / 2;
          
          newPositions[child.id] = {
            x: childX,
            y: childY,
            width: stateWidth,
            height: stateHeight
          };
          
          layoutNestedChildren(child.id, ElementType.STATE);
        });
      } else if (parentType === ElementType.PROCESS) {
        // Subprocesses inside Process: lay out in a clean vertical flow representing temporal invocation order
        const numSubs = directChildren.length;
        const padding = 25;
        const subWidth = 110;
        const subHeight = 55;
        
        const reqHeight = numSubs * (subHeight + 20) + padding * 2;
        if (reqHeight > parentVis.height) {
          parentVis.height = reqHeight + 10;
        }

        const spacingY = (parentVis.height - padding * 2) / numSubs;

        directChildren.forEach((child, idx) => {
          const childX = (parentVis.width - subWidth) / 2;
          const childY = padding + idx * spacingY + (spacingY - subHeight) / 2;

          newPositions[child.id] = {
            x: childX,
            y: childY,
            width: subWidth,
            height: subHeight
          };

          layoutNestedChildren(child.id, ElementType.PROCESS);
        });
      }
    };

    // Recursively position child nodes nested inside their respective parents (processes or objects)
    if (currentOpd.parentProcessId) {
      layoutNestedChildren(currentOpd.parentProcessId, ElementType.PROCESS);
    }

    topLevelElements.forEach(tl => {
      if (tl.id !== currentOpd.parentProcessId) {
        layoutNestedChildren(tl.id, tl.type);
      }
    });

    // Reset layout anchors so link connections dynamic/center snap wonderfully around new position
    updateModel(prev => ({
      ...prev,
      opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
        ...o,
        visual: {
          elements: o.visual.elements.map(ve => {
            const pos = newPositions[ve.id];
            return pos ? { ...ve, ...pos } : ve;
          }),
          links: o.visual.links.map(vl => ({
            ...vl,
            sourceAnchor: undefined,
            targetAnchor: undefined
          }))
        }
      } : o)
    }));
  };

  const addExistingElement = (elementId: string) => {
    console.log('addExistingElement called', { elementId });
    const isAlreadyVisible = currentOpd.visual.elements.some(e => e.id === elementId);
    const existingVisualElementIds = currentOpd.visual.elements.map(e => e.id);
    const targetIdsToCheck = [...new Set([...existingVisualElementIds, currentOpd.parentProcessId].filter(Boolean) as string[])];
    const existingVisualLinkIds = currentOpd.visual.links.map(l => l.id);
    const logicalLinksToImport = model.logical.links.filter(l => 
      !existingVisualLinkIds.includes(l.id) && (
        (l.sourceId === elementId && targetIdsToCheck.includes(l.targetId)) ||
        (l.targetId === elementId && targetIdsToCheck.includes(l.sourceId))
      )
    );

    const elObj = model.logical.elements.find(e => e.id === elementId);
    const isSubprocess = elObj?.type === ElementType.PROCESS && currentOpd.parentProcessId;

    const performAdd = (linksToImport: LogicalLink[]) => {
      const newVisualLinks: VisualLink[] = linksToImport.map(l => ({ id: l.id }));
      updateModel(prev => {
        const updatedOpds = prev.opds.map(o => {
          if (o.id !== prev.currentOpdId) return o;
          const updatedElements = isAlreadyVisible 
            ? o.visual.elements 
            : [...o.visual.elements, {
                id: elementId,
                x: 100,
                y: 100,
                width: 120,
                height: 60,
                parentId: isSubprocess ? currentOpd.parentProcessId : undefined
              }];
          return {
            ...o,
            visual: {
              ...o.visual,
              elements: updatedElements,
              links: [...o.visual.links, ...newVisualLinks]
            }
          };
        });
        return {
          ...prev,
          logical: {
            ...prev.logical,
            elements: prev.logical.elements.map(el => 
              el.id === elementId && !el.parentId && el.type === ElementType.PROCESS && currentOpd.parentProcessId 
                ? { ...el, parentId: currentOpd.parentProcessId } 
                : el
            )
          },
          opds: updatedOpds
        };
      });
      setIsAddExistingOpen(false);
    };

    if (logicalLinksToImport.length > 0) {
      const relationCount = logicalLinksToImport.length;
      const hasParentRelation = logicalLinksToImport.some(l => l.sourceId === currentOpd.parentProcessId || l.targetId === currentOpd.parentProcessId);
      const message = hasParentRelation 
        ? `Found ${relationCount} existing relations (including with the parent process). Import them to this diagram?`
        : `Found ${relationCount} existing relations for this element. Import them to this diagram?`;
      
      setDialog({
        isOpen: true,
        title: "Import Relations",
        message,
        confirmLabel: "Import",
        cancelLabel: "Skip",
        onConfirm: () => {
          performAdd(logicalLinksToImport);
          setDialog(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          performAdd([]);
          setDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      performAdd([]);
    }
  };

  const zoomOut = () => {
    if (!currentOpd.parentProcessId) return;
    
    const parentOpd = model.opds.find(o => o.visual.elements.some(e => e.id === currentOpd.parentProcessId));
    if (parentOpd) {
      setModel(prev => ({ ...prev, currentOpdId: parentOpd.id }));
    } else {
      const sd = model.opds.find(o => !o.parentProcessId);
      if (sd) setModel(prev => ({ ...prev, currentOpdId: sd.id }));
    }
    setSelectedId(null);
    setSelectedLinkId(null);
  };

  useEffect(() => {
    const handleResize = () => {
      const sidebarWidth = 400;
      const toolbarWidth = 80;
      setStageSize({
        width: window.innerWidth - sidebarWidth - toolbarWidth,
        height: window.innerHeight - 64
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, selectedLinkId, model]);

  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const clickedNode = e.target;
    const targetId = clickedNode.id() || (clickedNode.getParent() && clickedNode.getParent().id());
    const targetEl = model.logical.elements.find(el => el.id === targetId);
    const clickedOnParent = targetId === currentOpd.parentProcessId;

    if (tool === ElementType.OBJECT || tool === ElementType.PROCESS) {
      if (clickedOnEmpty || clickedOnParent || (targetEl && targetEl.type === ElementType.PROCESS)) {
        const pos = stageRef.current.getPointerPosition();
        
        // Only allow parentId nesting for subprocesses inside processes
        const isSubprocess = tool === ElementType.PROCESS && 
          ((targetEl && targetEl.type === ElementType.PROCESS) || !!currentOpd.parentProcessId);
        
        const parentId = isSubprocess 
          ? ((targetEl && targetEl.type === ElementType.PROCESS) ? targetEl.id : currentOpd.parentProcessId)
          : undefined;
        
        const parentVisual = parentId ? getAbsolutePosition(parentId) : null;
        
        const relativeX = parentVisual ? pos.x - parentVisual.x : pos.x;
        const relativeY = parentVisual ? pos.y - parentVisual.y : pos.y;

        const defaultName = tool === ElementType.OBJECT ? 'New Object' : 'New Process';
        const name = window.prompt(`Enter name for ${tool.toLowerCase()}:`, defaultName) || defaultName;
        
        const id = uuidv4();
        const newLogical: LogicalElement = {
          id,
          type: tool as ElementType,
          name: name,
          essence: Essence.INFORMATIONAL,
          affiliation: Affiliation.SYSTEMIC,
          parentId: parentId,
        };
        const newVisual: VisualElement = {
          id,
          x: relativeX - 60,
          y: relativeY - 35,
          width: tool === ElementType.OBJECT ? 120 : 140,
          height: tool === ElementType.OBJECT ? 60 : 70,
        };

        updateModel(prev => ({
          ...prev,
          logical: { ...prev.logical, elements: [...prev.logical.elements, newLogical] },
          opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
            ...o,
            visual: { ...o.visual, elements: [...o.visual.elements, newVisual] }
          } : o)
        }));
        setTool('select');
      }
    } else if (clickedOnEmpty) {
      setSelectedId(null);
      setSelectedLinkId(null);
    }
  };

  const processImportData = (imported: any, fileName?: string) => {
    if (!imported || typeof imported !== 'object') {
      setDialog({
        isOpen: true,
        title: "Import Failed",
        message: "The uploaded file does not contain valid JSON data.",
        confirmLabel: "OK",
        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Check if visual diagram representations exist
    const hasDiagrams = Array.isArray(imported.diagrams) && imported.diagrams.length > 0;
    const hasOpds = Array.isArray(imported.opds) && imported.opds.length > 0;
    const hasVisual = imported.visual && Array.isArray(imported.visual.elements) && imported.visual.elements.length > 0;
    const hasInlineVisual = Array.isArray(imported.elements) && imported.elements.some((el: any) => el.x !== undefined || el.y !== undefined);

    // Extract logical model candidates
    const rawLogical = imported.logicalModel || imported.logical || (Array.isArray(imported.elements) ? imported : null);
    const elements: any[] = rawLogical?.elements || (Array.isArray(imported.elements) ? imported.elements : null);
    const links: any[] = rawLogical?.links || (Array.isArray(imported.links) ? imported.links : []);
    const tags: any[] = rawLogical?.tags || (Array.isArray(imported.tags) ? imported.tags : []);

    // A: PURE INFORMATION MODEL (No visual diagrams / representations)
    if (!hasDiagrams && !hasOpds && !hasVisual && !hasInlineVisual) {
      if (elements && Array.isArray(elements) && elements.length > 0) {
        const cleanElements: LogicalElement[] = elements.map((el: any) => {
          const { x, y, width, height, isExpanded, ...rest } = el;
          return {
            id: rest.id || uuidv4(),
            type: rest.type || ElementType.OBJECT,
            name: rest.name || 'Unnamed',
            essence: rest.essence || Essence.INFORMATIONAL,
            affiliation: rest.affiliation || Affiliation.SYSTEMIC,
            parentId: rest.parentId,
            isInitial: rest.isInitial,
            isFinal: rest.isFinal,
            isDefault: rest.isDefault,
            isActive: rest.isActive
          };
        });

        const cleanLinks: LogicalLink[] = links.map((l: any) => {
          const { sourceAnchor, targetAnchor, showTagLabel, ...rest } = l;
          return {
            id: rest.id || uuidv4(),
            type: rest.type || LinkType.CONSUMPTION,
            sourceId: rest.sourceId,
            targetId: rest.targetId,
            sourceCardinality: rest.sourceCardinality,
            targetCardinality: rest.targetCardinality,
            tag: rest.tag
          };
        });

        const cleanTags: TagDefinition[] = tags.map((t: any) => ({
          id: t.id || t.name,
          name: t.name || t.id
        }));

        const cleanLogical = {
          elements: cleanElements,
          links: cleanLinks,
          tags: cleanTags
        };

        const hierarchy = analyzeModelHierarchy(cleanLogical);

        setInfoModelPrompt({
          isOpen: true,
          logical: cleanLogical,
          hierarchy,
          fileName
        });
        return;
      }
    }

    // B: MODEL WITH DIAGRAMS / VISUAL REPRESENTATIONS
    // 1. Schema written by exportModel (logicalModel & diagrams)
    if (imported.logicalModel && imported.diagrams) {
      const logical = imported.logicalModel;
      const opds = imported.diagrams.map((diag: any) => ({
        id: diag.id,
        name: diag.name,
        parentProcessId: diag.parentProcessId,
        visual: diag.visualRepresentation || diag.visual || { elements: [], links: [], tagStyles: [] }
      }));
      const currentOpdId = imported.currentOpdId || opds[0]?.id || '';
      updateModel(normalizeOPMModel({
        logical,
        opds,
        currentOpdId
      }));
      setToastMessage(`Imported model with ${opds.length} diagram${opds.length === 1 ? '' : 's'}.`);
    }
    // 2. Direct OPMModel format (logical & opds)
    else if (imported.logical && imported.opds) {
      const currentOpdId = imported.currentOpdId || imported.opds[0]?.id || '';
      updateModel(normalizeOPMModel({
        logical: imported.logical,
        opds: imported.opds,
        currentOpdId
      }));
      setToastMessage(`Imported model with ${imported.opds.length} diagram${imported.opds.length === 1 ? '' : 's'}.`);
    }
    // 3. Single-diagram representation with logical and visual
    else if (imported.logical && imported.visual) {
      const sdId = uuidv4();
      updateModel(normalizeOPMModel({
        logical: imported.logical,
        opds: [{ id: sdId, name: 'SD', visual: imported.visual }],
        currentOpdId: sdId
      }));
      setToastMessage("Imported diagram successfully.");
    }
    // 4. Legacy format (elements & links inline with visual variables)
    else if (imported.elements && imported.links) {
      const logical = {
        elements: imported.elements.map((el: any) => {
          const { x, y, width, height, isExpanded, ...rest } = el;
          return { ...rest };
        }),
        links: imported.links.map((l: any) => {
          const { sourceAnchor, targetAnchor, ...rest } = l;
          return { ...rest };
        })
      };
      const visual = {
        elements: imported.elements.map((el: any) => ({
          id: el.id,
          x: el.x || 50,
          y: el.y || 50,
          width: el.width || 120,
          height: el.height || 60,
          parentId: el.parentId,
          isExpanded: el.isExpanded
        })),
        links: imported.links.map((l: any) => ({
          id: l.id,
          sourceAnchor: l.sourceAnchor,
          targetAnchor: l.targetAnchor
        })),
        tagStyles: []
      };
      const sdId = uuidv4();
      updateModel(normalizeOPMModel({
        logical,
        opds: [{ id: sdId, name: 'SD', visual }],
        currentOpdId: sdId
      }));
      setToastMessage("Imported legacy model successfully.");
    } else {
      setDialog({
        isOpen: true,
        title: "Import Failed",
        message: "The selected file is not a valid OPM model schema.",
        confirmLabel: "OK",
        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        processImportData(imported, file.name);
      } catch (err) {
        setDialog({
          isOpen: true,
          title: "Import Error",
          message: "Failed to parse the uploaded JSON file.",
          confirmLabel: "OK",
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
      } finally {
        // Clear input value to allow re-uploading the same file if needed
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        processImportData(imported, file.name);
      } catch (err) {
        setDialog({
          isOpen: true,
          title: "Import Error",
          message: "Failed to parse the dropped JSON file.",
          confirmLabel: "OK",
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
    };
    reader.readAsText(file);
  };

  const confirmGenerateDiagrams = () => {
    if (!infoModelPrompt) return;
    const { logical, hierarchy } = infoModelPrompt;
    pushToHistory();
    const synthesized = synthesizeDiagramsFromLogical(logical);
    const newModel = normalizeOPMModel({
      logical,
      opds: synthesized.opds,
      currentOpdId: synthesized.currentOpdId
    });
    setModel(newModel);
    setSelectedId(null);
    setSelectedLinkId(null);
    setInfoModelPrompt(null);
    setToastMessage(`Generated ${synthesized.opds.length} diagram${synthesized.opds.length === 1 ? '' : 's'} (Depth: ${hierarchy.maxDepth}) for OPM exploration.`);
  };

  const isValidLink = (sourceId: string, targetId: string, type: LinkType): boolean => {
    const source = model.logical.elements.find(e => e.id === sourceId);
    const target = model.logical.elements.find(e => e.id === targetId);
    if (!source || !target) return false;

    const sourceIsObject = source.type === ElementType.OBJECT;
    const sourceIsProcess = source.type === ElementType.PROCESS;
    const sourceIsState = source.type === ElementType.STATE;
    const targetIsObject = target.type === ElementType.OBJECT;
    const targetIsProcess = target.type === ElementType.PROCESS;
    const targetIsState = target.type === ElementType.STATE;

    switch (type) {
      case LinkType.AGENT:
      case LinkType.INSTRUMENT:
        return (sourceIsObject || sourceIsState) && targetIsProcess;
      case LinkType.CONSUMPTION:
        return (sourceIsObject || sourceIsState) && targetIsProcess;
      case LinkType.RESULT:
        return sourceIsProcess && (targetIsObject || targetIsState);
      case LinkType.EFFECT:
        return (sourceIsProcess && (targetIsObject || targetIsState)) || 
               ((sourceIsObject || sourceIsState) && targetIsProcess);
      case LinkType.CONDITION:
      case LinkType.EVENT:
      case LinkType.EXCEPTION:
        return (sourceIsObject || sourceIsState) && targetIsProcess;
      case LinkType.AGGREGATION:
      case LinkType.GENERALIZATION:
      case LinkType.INSTANTIATION:
        return (sourceIsObject && targetIsObject) || (sourceIsProcess && targetIsProcess);
      case LinkType.EXHIBITION:
        return (sourceIsObject || sourceIsProcess) && (targetIsObject || targetIsProcess);
      case LinkType.TAGGED_STRUCTURAL:
        return sourceIsObject && targetIsObject;
      case LinkType.INVOCATION:
        return sourceIsProcess && targetIsProcess;
      default:
        return false;
    }
  };

  const handleElementClick = (id: string) => {
    if (tool === 'select') {
      setSelectedId(id);
      setSelectedLinkId(null);
    } else if (tool === 'procedural' || Object.values(LinkType).includes(tool as LinkType)) {
      if (!linkingSource) {
        setLinkingSource(id);
      } else {
        const source = model.logical.elements.find(e => e.id === linkingSource);
        const target = model.logical.elements.find(e => e.id === id);
        
        let linkType = tool as LinkType;
        if (tool === 'procedural') {
          if ((source?.type === ElementType.OBJECT || source?.type === ElementType.STATE) && target?.type === ElementType.PROCESS) {
            linkType = LinkType.CONSUMPTION;
          } else if (source?.type === ElementType.PROCESS && (target?.type === ElementType.OBJECT || target?.type === ElementType.STATE)) {
            linkType = LinkType.RESULT;
          } else {
            alert("Procedural links must connect an Object/State to a Process or vice versa.");
            setLinkingSource(null);
            setTool('select');
            return;
          }
        }

        if (linkType === LinkType.TAGGED_STRUCTURAL) {
          const sourceIsObject = source?.type === ElementType.OBJECT;
          const targetIsObject = target?.type === ElementType.OBJECT;
          if (!sourceIsObject || !targetIsObject) {
            setDialog({
              isOpen: true,
              title: "Tagged Structural Link Constraint",
              message: "Tagged structural links must connect two Objects (Object → Object). Please select an Object.",
              confirmLabel: "Understood",
              onConfirm: () => {
                setDialog(prev => ({ ...prev, isOpen: false }));
              }
            });
            setLinkingSource(null);
            return;
          }

          if (linkingSource === id) {
            setLinkingSource(null);
            return;
          }

          const existingTags = model.logical.tags || [];
          const initialTag = existingTags.length > 0 ? existingTags[0].name : 'supports';
          setSelectedTagInput(initialTag);
          const currentStyle = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === initialTag.toLowerCase());
          setNewTagColor(currentStyle?.color || '#2563eb');
          setNewTagLineStyle(currentStyle?.lineStyle || 'solid');
          setNewTagShowLabel(currentStyle?.showTagLabel !== undefined ? currentStyle.showTagLabel : true);

          setTaggedLinkDialog({
            isOpen: true,
            sourceId: linkingSource,
            targetId: id,
            sourceName: source?.name || 'Object',
            targetName: target?.name || 'Object'
          });
          setLinkingSource(null);
          return;
        }

        if (linkingSource !== id && isValidLink(linkingSource, id, linkType)) {
          const linkId = uuidv4();
          const newLogical: LogicalLink = {
            id: linkId,
            type: linkType,
            sourceId: linkingSource,
            targetId: id
          };
          const newVisual: VisualLink = {
            id: linkId
          };
          updateModel(prev => ({
            ...prev,
            logical: { ...prev.logical, links: [...prev.logical.links, newLogical] },
            opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
              ...o,
              visual: { ...o.visual, links: [...o.visual.links, newVisual] }
            } : o)
          }));
        } else if (linkingSource !== id) {
          alert(`Invalid link type for the selected elements.`);
        }
        setLinkingSource(null);
        setTool('select');
      }
    }
  };

  const handleElementDragMove = (id: string, e: any) => {
    const target = e.target;
    const currentX = target.x();
    const currentY = target.y();

    const logicalEl = model.logical.elements.find(el => el.id === id);
    if (!logicalEl) return;

    if (logicalEl.type === ElementType.STATE && logicalEl.parentId) {
      const parentVisual = currentOpd.visual.elements.find(ve => ve.id === logicalEl.parentId);
      const stateVisual = currentOpd.visual.elements.find(ve => ve.id === id);
      if (parentVisual && stateVisual) {
        const padding = 6;
        let constrainedX = Math.max(padding, currentX);
        let constrainedY = Math.max(padding, currentY);

        let maxAllowedX = parentVisual.width - stateVisual.width - padding;
        let maxAllowedY = parentVisual.height - stateVisual.height - padding;

        let needsParentExpansion = false;
        let newParentWidth = parentVisual.width;
        let newParentHeight = parentVisual.height;

        if (constrainedX > maxAllowedX) {
          newParentWidth = constrainedX + stateVisual.width + padding;
          needsParentExpansion = true;
        }
        if (constrainedY > maxAllowedY) {
          newParentHeight = constrainedY + stateVisual.height + padding;
          needsParentExpansion = true;
        }

        target.x(constrainedX);
        target.y(constrainedY);

        if (needsParentExpansion) {
          updateModel(prev => ({
            ...prev,
            opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
              ...o,
              visual: {
                ...o.visual,
                elements: o.visual.elements.map(ve => {
                  if (ve.id === logicalEl.parentId) {
                    return { ...ve, width: newParentWidth, height: newParentHeight };
                  }
                  return ve;
                })
              }
            } : o)
          }));
        }
      }
    }
  };

  const handleDragEnd = (id: string, e: any) => {
    let { x, y } = e.target.attrs;
    
    const logicalEl = model.logical.elements.find(el => el.id === id);
    if (logicalEl && logicalEl.type === ElementType.STATE && logicalEl.parentId) {
      const parentVisual = currentOpd.visual.elements.find(ve => ve.id === logicalEl.parentId);
      const stateVisual = currentOpd.visual.elements.find(ve => ve.id === id);
      if (parentVisual && stateVisual) {
        const padding = 6;
        x = Math.max(padding, x);
        y = Math.max(padding, y);

        let maxAllowedX = parentVisual.width - stateVisual.width - padding;
        let maxAllowedY = parentVisual.height - stateVisual.height - padding;

        let newParentWidth = parentVisual.width;
        let newParentHeight = parentVisual.height;

        if (x > maxAllowedX) {
          newParentWidth = x + stateVisual.width + padding;
        }
        if (y > maxAllowedY) {
          newParentHeight = y + stateVisual.height + padding;
        }

        updateModel(prev => ({
          ...prev,
          opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
            ...o,
            visual: {
              ...o.visual,
              elements: o.visual.elements.map(ve => {
                if (ve.id === id) {
                  return { ...ve, x, y };
                }
                if (ve.id === logicalEl.parentId) {
                  return { ...ve, width: newParentWidth, height: newParentHeight };
                }
                return ve;
              })
            }
          } : o)
        }));
        return;
      }
    }

    // Default drag end for standard elements
    updateModel(prev => ({
      ...prev,
      opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
        ...o,
        visual: {
          ...o.visual,
          elements: o.visual.elements.map(el => el.id === id ? { ...el, x, y } : el)
        }
      } : o)
    }));
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const nodeId = node.id();

    updateModel(prev => ({
      ...prev,
      opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
        ...o,
        visual: {
          ...o.visual,
          elements: o.visual.elements.map(el => {
            if (el.id === nodeId) {
              let nextWidth = Math.max(20, el.width * scaleX);
              let nextHeight = Math.max(20, el.height * scaleY);
              
              const children = prev.logical.elements.filter(child => child.parentId === nodeId);
              const padding = 6;
              children.forEach(child => {
                const childVisual = o.visual.elements.find(ve => ve.id === child.id);
                if (childVisual) {
                  const reqWidth = childVisual.x + childVisual.width + padding;
                  const reqHeight = childVisual.y + childVisual.height + padding;
                  if (reqWidth > nextWidth) nextWidth = reqWidth;
                  if (reqHeight > nextHeight) nextHeight = reqHeight;
                }
              });

              return {
                ...el,
                x: node.x(),
                y: node.y(),
                width: nextWidth,
                height: nextHeight,
              };
            }
            return el;
          })
        }
      } : o)
    }));
  };

  const updateLinkType = (id: string, type: LinkType) => {
    updateModel(prev => ({
      ...prev,
      logical: {
        ...prev.logical,
        links: prev.logical.links.map(l => l.id === id ? { ...l, type } : l)
      }
    }));
  };

  const updateElementName = (id: string, name: string) => {
    updateModel(prev => ({
      ...prev,
      logical: {
        ...prev.logical,
        elements: prev.logical.elements.map(el => el.id === id ? { ...el, name } : el)
      }
    }));
  };

  const addChild = (type: ElementType) => {
    if (!selectedId) return;
    const parent = model.logical.elements.find(e => e.id === selectedId);
    if (!parent) return;

    const defaultName = type === ElementType.STATE ? 'New State' : 'New Subprocess';
    const name = window.prompt(`Enter name for ${type.toLowerCase()}:`, defaultName) || defaultName;

    const id = uuidv4();
    const newLogical: LogicalElement = {
      id,
      type: type,
      name: name,
      essence: Essence.INFORMATIONAL,
      affiliation: Affiliation.SYSTEMIC,
      parentId: selectedId
    };
    const newVisual: VisualElement = {
      id,
      x: 10,
      y: 10,
      width: type === ElementType.STATE ? 60 : 80,
      height: type === ElementType.STATE ? 30 : 40,
      parentId: selectedId
    };

    updateModel(prev => ({
      ...prev,
      logical: { ...prev.logical, elements: [...prev.logical.elements, newLogical] },
      opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
        ...o,
        visual: { ...o.visual, elements: [...o.visual.elements, newVisual] }
      } : o)
    }));
  };

  const deleteSelected = () => {
    console.log('deleteSelected called', { selectedId, selectedLinkId });
    if (selectedId) {
      const getDescendantIds = (id: string): string[] => {
        const children = model.logical.elements.filter(el => el.parentId === id);
        let ids = [id];
        children.forEach(child => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };

      const idsToDelete = getDescendantIds(selectedId);
      
      // Count visual representations across all OPDs
      const representationsCount = model.opds.reduce((count, opd) => {
        return count + (opd.visual.elements.some(ve => ve.id === selectedId) ? 1 : 0);
      }, 0);

      console.log('representationsCount', representationsCount);

      const performRemoveFromDiagram = () => {
        const linksToRemove = model.logical.links.filter(l => 
          idsToDelete.includes(l.sourceId) || idsToDelete.includes(l.targetId)
        ).map(l => l.id);

        updateModel(prev => ({
          ...prev,
          opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
            ...o,
            visual: {
              elements: o.visual.elements.filter(el => !idsToDelete.includes(el.id)),
              links: o.visual.links.filter(l => !linksToRemove.includes(l.id))
            }
          } : o)
        }));
        setSelectedId(null);
      };

      const performDeleteFromModel = () => {
        const linksToDelete = model.logical.links.filter(l => 
          idsToDelete.includes(l.sourceId) || idsToDelete.includes(l.targetId)
        ).map(l => l.id);

        updateModel(prev => ({
          ...prev,
          logical: {
            elements: prev.logical.elements.filter(el => !idsToDelete.includes(el.id)),
            links: prev.logical.links.filter(l => !linksToDelete.includes(l.id))
          },
          opds: prev.opds.map(o => ({
            ...o,
            visual: {
              elements: o.visual.elements.filter(el => !idsToDelete.includes(el.id)),
              links: o.visual.links.filter(l => !linksToDelete.includes(l.id))
            }
          }))
        }));
        setSelectedId(null);
      };

      if (representationsCount > 1) {
        setDialog({
          isOpen: true,
          title: "Delete Element",
          message: "This element exists in other diagrams. What would you like to do?",
          confirmLabel: "Remove from THIS diagram only",
          cancelLabel: "Cancel",
          onConfirm: () => {
            performRemoveFromDiagram();
            setDialog(prev => ({ ...prev, isOpen: false }));
          },
          showSecondary: true,
          secondaryLabel: "Delete from ENTIRE model",
          onSecondary: () => {
            performDeleteFromModel();
            setDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        setDialog({
          isOpen: true,
          title: "Delete Element",
          message: "This is the last representation of this element. Deleting it will remove it from the entire model and delete all its relations. Continue?",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          onConfirm: () => {
            performDeleteFromModel();
            setDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      }
    } else if (selectedLinkId) {
      console.log('deleteSelected (link) called', { selectedLinkId });
      const representationsCount = model.opds.reduce((count, opd) => {
        return count + (opd.visual.links.some(vl => vl.id === selectedLinkId) ? 1 : 0);
      }, 0);
      console.log('link representationsCount', representationsCount);

      const performRemoveLinkFromDiagram = () => {
        updateModel(prev => ({
          ...prev,
          opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
            ...o,
            visual: {
              ...o.visual,
              links: o.visual.links.filter(l => l.id !== selectedLinkId)
            }
          } : o)
        }));
        setSelectedLinkId(null);
      };

      const performDeleteLinkFromModel = () => {
        updateModel(prev => ({
          ...prev,
          logical: {
            ...prev.logical,
            links: prev.logical.links.filter(l => l.id !== selectedLinkId)
          },
          opds: prev.opds.map(o => ({
            ...o,
            visual: {
              ...o.visual,
              links: o.visual.links.filter(l => l.id !== selectedLinkId)
            }
          }))
        }));
        setSelectedLinkId(null);
      };

      if (representationsCount > 1) {
        setDialog({
          isOpen: true,
          title: "Delete Relation",
          message: "This relation exists in other diagrams. What would you like to do?",
          confirmLabel: "Remove from THIS diagram only",
          cancelLabel: "Cancel",
          onConfirm: () => {
            performRemoveLinkFromDiagram();
            setDialog(prev => ({ ...prev, isOpen: false }));
          },
          showSecondary: true,
          secondaryLabel: "Delete from ENTIRE model",
          onSecondary: () => {
            performDeleteLinkFromModel();
            setDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        setDialog({
          isOpen: true,
          title: "Delete Relation",
          message: "Are you sure you want to delete this relation?",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          onConfirm: () => {
            performDeleteLinkFromModel();
            setDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      }
    }
  };

  const exportModel = () => {
    const exportData = {
      logicalModel: model.logical,
      diagrams: model.opds.map(opd => ({
        id: opd.id,
        name: opd.name,
        parentProcessId: opd.parentProcessId,
        visualRepresentation: opd.visual
      }))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "opm-model.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const oplSentences = generateOPL(model.logical, oplMode === 'diagram' ? currentOpd.visual : undefined);

  const getAbsolutePosition = (elId: string, visited = new Set<string>()): { x: number, y: number, width: number, height: number } => {
    if (visited.has(elId)) return { x: 0, y: 0, width: 0, height: 0 };
    visited.add(elId);

    const logicalEl = model.logical.elements.find(e => e.id === elId);
    const visualEl = currentOpd.visual.elements.find(e => e.id === elId);
    if (!logicalEl || !visualEl) return { x: 0, y: 0, width: 0, height: 0 };

    if (logicalEl.parentId && currentOpd.visual.elements.some(ve => ve.id === logicalEl.parentId)) {
      const parentPos = getAbsolutePosition(logicalEl.parentId, visited);
      return {
        x: parentPos.x + visualEl.x,
        y: parentPos.y + visualEl.y,
        width: visualEl.width,
        height: visualEl.height
      };
    }
    return { x: visualEl.x, y: visualEl.y, width: visualEl.width, height: visualEl.height };
  };

  const renderLink = (link: LogicalLink) => {
    const sourceEl = model.logical.elements.find(e => e.id === link.sourceId);
    const targetEl = model.logical.elements.find(e => e.id === link.targetId);
    const visualLink = currentOpd.visual.links.find(l => l.id === link.id);
    if (!sourceEl || !targetEl || !visualLink) return null;

    const sourcePos = getAbsolutePosition(sourceEl.id);
    const targetPos = getAbsolutePosition(targetEl.id);

    const snapToBoundary = (absX: number, absY: number, el: { x: number, y: number, width: number, height: number }, type: ElementType) => {
      if (el.width === 0 || el.height === 0) return { x: 0.5, y: 0.5 };
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const dx = absX - cx;
      const dy = absY - cy;

      if (type === ElementType.OBJECT || type === ElementType.STATE) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const halfW = el.width / 2;
        const halfH = el.height / 2;

        if (absDx / halfW > absDy / halfH) {
          return {
            x: (dx > 0 ? halfW : -halfW) / el.width + 0.5,
            y: (dy * (halfW / absDx)) / el.height + 0.5
          };
        } else {
          return {
            x: (dx * (halfH / absDy)) / el.width + 0.5,
            y: (dy > 0 ? halfH : -halfH) / el.height + 0.5
          };
        }
      } else {
        const a = el.width / 2;
        const b = el.height / 2;
        const angle = Math.atan2(dy, dx);
        return {
          x: (a * Math.cos(angle)) / el.width + 0.5,
          y: (b * Math.sin(angle)) / el.height + 0.5
        };
      }
    };

    const sourceCenter = { x: sourcePos.x + sourcePos.width / 2, y: sourcePos.y + sourcePos.height / 2 };
    const targetCenter = { x: targetPos.x + targetPos.width / 2, y: targetPos.y + targetPos.height / 2 };

    const sAnchor = visualLink.sourceAnchor || snapToBoundary(targetCenter.x, targetCenter.y, sourcePos, sourceEl.type);
    const tAnchor = visualLink.targetAnchor || snapToBoundary(sourceCenter.x, sourceCenter.y, targetPos, targetEl.type);

    const fromX = sourcePos.x + sAnchor.x * sourcePos.width;
    const fromY = sourcePos.y + sAnchor.y * sourcePos.height;
    const toX = targetPos.x + tAnchor.x * targetPos.width;
    const toY = targetPos.y + tAnchor.y * targetPos.height;

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const isSelected = selectedLinkId === link.id;
    
    const handleAnchorDrag = (id: string, isSource: boolean, e: any) => {
      const { x: absX, y: absY } = e.target.attrs;
      const link = model.logical.links.find(l => l.id === id);
      if (!link) return;

      const elId = isSource ? link.sourceId : link.targetId;
      const el = model.logical.elements.find(e => e.id === elId);
      if (!el) return;

      const absPos = getAbsolutePosition(el.id);
      const snapped = snapToBoundary(absX, absY, absPos, el.type);
      
      setModel(prev => ({
        ...prev,
        opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
          ...o,
          visual: {
            ...o.visual,
            links: o.visual.links.map(l => l.id === id ? {
              ...l,
              [isSource ? 'sourceAnchor' : 'targetAnchor']: snapped
            } : l)
          }
        } : o)
      }));
    };

    const handleAnchorDragEnd = (id: string, isSource: boolean, e: any) => {
      // Final update with history
      const { x: absX, y: absY } = e.target.attrs;
      const link = model.logical.links.find(l => l.id === id);
      if (!link) return;

      const elId = isSource ? link.sourceId : link.targetId;
      const el = model.logical.elements.find(e => e.id === elId);
      if (!el) return;

      const absPos = getAbsolutePosition(el.id);
      const snapped = snapToBoundary(absX, absY, absPos, el.type);
      
      setModel(prev => ({
        ...prev,
        opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
          ...o,
          visual: {
            ...o.visual,
            links: o.visual.links.map(l => l.id === id ? {
              ...l,
              [isSource ? 'sourceAnchor' : 'targetAnchor']: snapped
            } : l)
          }
        } : o)
      }));
    };

    const linkColor = isSelected ? '#4f46e5' : '#475569';
    const linkWidth = isSelected ? 3 : 2;

    const renderHandles = () => {
      if (!isSelected) return null;
      return (
        <Group>
          <KonvaCircle 
            x={fromX} y={fromY} radius={6} fill="white" stroke="#4f46e5" strokeWidth={2} draggable 
            onDragStart={pushToHistory}
            onDragMove={(e) => handleAnchorDrag(link.id, true, e)} 
            onDragEnd={(e) => handleAnchorDragEnd(link.id, true, e)}
          />
          <KonvaCircle 
            x={toX} y={toY} radius={6} fill="white" stroke="#4f46e5" strokeWidth={2} draggable 
            onDragStart={pushToHistory}
            onDragMove={(e) => handleAnchorDrag(link.id, false, e)} 
            onDragEnd={(e) => handleAnchorDragEnd(link.id, false, e)}
          />
        </Group>
      );
    };

    const commonProps = {
      onClick: (e: any) => { e.cancelBubble = true; setSelectedLinkId(link.id); setSelectedId(null); },
      stroke: linkColor,
      strokeWidth: linkWidth,
    };

    const renderCardinality = () => {
      return (
        <Group>
          {link.sourceCardinality && (
            <Text
              x={fromX + 15 * Math.cos(angle + Math.PI/4)}
              y={fromY + 15 * Math.sin(angle + Math.PI/4)}
              text={link.sourceCardinality}
              fontSize={12}
              fill="#475569"
            />
          )}
          {link.targetCardinality && (
            <Text
              x={toX - 25 * Math.cos(angle - Math.PI/4)}
              y={toY - 25 * Math.sin(angle - Math.PI/4)}
              text={link.targetCardinality}
              fontSize={12}
              fill="#475569"
            />
          )}
        </Group>
      );
    };

    // Procedural Links (Arrows)
    if (link.type === LinkType.CONSUMPTION || link.type === LinkType.RESULT || link.type === LinkType.EFFECT || link.type === LinkType.INVOCATION) {
      return (
        <Group key={link.id}>
          <Arrow
            points={[fromX, fromY, toX, toY]}
            {...commonProps}
            fill={linkColor}
            pointerLength={12}
            pointerWidth={10}
            pointerAtBeginning={link.type === LinkType.EFFECT}
            dash={link.type === LinkType.INVOCATION ? [5, 5] : undefined}
          />
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Agent Link
    if (link.type === LinkType.AGENT) {
      return (
        <Group key={link.id}>
          <Line points={[fromX, fromY, toX, toY]} {...commonProps} />
          <KonvaCircle x={toX - 6 * Math.cos(angle)} y={toY - 6 * Math.sin(angle)} radius={6} fill={linkColor} />
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Instrument Link
    if (link.type === LinkType.INSTRUMENT) {
      return (
        <Group key={link.id}>
          <Line points={[fromX, fromY, toX, toY]} {...commonProps} />
          <KonvaCircle x={toX - 6 * Math.cos(angle)} y={toY - 6 * Math.sin(angle)} radius={6} stroke={linkColor} fill="white" strokeWidth={2} />
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Structural Links (Triangles at source)
    if (link.type === LinkType.AGGREGATION || link.type === LinkType.EXHIBITION || link.type === LinkType.GENERALIZATION || link.type === LinkType.INSTANTIATION) {
      const triangleSize = 16;
      const offset = 15; // Shift the arrowhead away from the end of the edge to differ from procedural links
      const lineStartAfterTriangleX = fromX + (offset + triangleSize) * Math.cos(angle);
      const lineStartAfterTriangleY = fromY + (offset + triangleSize) * Math.sin(angle);
      
      return (
        <Group key={link.id}>
          {/* Segment from source element to apex */}
          <Line points={[fromX, fromY, fromX + offset * Math.cos(angle), fromY + offset * Math.sin(angle)]} {...commonProps} />
          {/* Main segment from base of triangle to target element */}
          <Line points={[lineStartAfterTriangleX, lineStartAfterTriangleY, toX, toY]} {...commonProps} />
          
          <Group x={fromX} y={fromY} rotation={(angle * 180) / Math.PI} onClick={commonProps.onClick}>
            {/* The main triangle */}
            <Line
              points={[offset, 0, offset + triangleSize, -triangleSize/2, offset + triangleSize, triangleSize/2]}
              closed
              fill={link.type === LinkType.GENERALIZATION ? 'white' : linkColor}
              stroke={linkColor}
              strokeWidth={2}
            />
            {/* The line at the base of the triangle (underline) */}
            <Line
              points={[offset + triangleSize, -triangleSize/2 - 5, offset + triangleSize, triangleSize/2 + 5]}
              stroke={linkColor}
              strokeWidth={2}
            />
            {link.type === LinkType.EXHIBITION && (
              <Line points={[offset + triangleSize/4, 0, offset + triangleSize*0.8, -triangleSize/4, offset + triangleSize*0.8, triangleSize/4]} closed fill="white" stroke={linkColor} strokeWidth={1} />
            )}
            {link.type === LinkType.INSTANTIATION && (
              <KonvaCircle x={offset + triangleSize*0.6} radius={2.5} fill="white" />
            )}
          </Group>
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Tagged Structural Links (user-defined tagged structural relations)
    if (link.type === LinkType.TAGGED_STRUCTURAL) {
      const tagStyle = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === link.tag?.trim().toLowerCase());
      const effectiveColor = isSelected ? '#4f46e5' : (tagStyle?.color || '#2563eb');
      const effectiveWidth = isSelected ? 3 : 2;

      let dashPattern: number[] | undefined = undefined;
      const style = tagStyle?.lineStyle || 'solid';
      if (style === 'dashed') dashPattern = [8, 6];
      else if (style === 'dotted') dashPattern = [3, 4];
      else if (style === 'dash-dot') dashPattern = [10, 4, 3, 4];

      const taggedProps = {
        ...commonProps,
        stroke: effectiveColor,
        strokeWidth: effectiveWidth,
        dash: dashPattern,
      };

      const showLabel = visualLink.showTagLabel !== undefined 
        ? visualLink.showTagLabel 
        : (tagStyle ? tagStyle.showTagLabel !== false : true);
      const tagText = link.tag?.trim() || '';
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      const badgeWidth = Math.max(52, tagText.length * 8 + 18);
      const badgeHeight = 22;

      return (
        <Group key={link.id}>
          <Arrow
            points={[fromX, fromY, toX, toY]}
            {...taggedProps}
            fill={effectiveColor}
            pointerLength={10}
            pointerWidth={8}
          />
          {showLabel && tagText && (
            <Group x={midX} y={midY} onClick={commonProps.onClick}>
              <Rect
                x={-badgeWidth / 2}
                y={-badgeHeight / 2}
                width={badgeWidth}
                height={badgeHeight}
                fill="#ffffff"
                stroke={effectiveColor}
                strokeWidth={1.5}
                cornerRadius={6}
                shadowColor="rgba(0, 0, 0, 0.12)"
                shadowBlur={3}
                shadowOffset={{ x: 0, y: 1 }}
              />
              <Text
                x={-badgeWidth / 2}
                y={-badgeHeight / 2}
                width={badgeWidth}
                height={badgeHeight}
                text={tagText}
                fontSize={11}
                fontStyle="italic bold"
                fill={effectiveColor}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          )}
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    // Control Links (Condition, Event, Exception)
    if (link.type === LinkType.CONDITION || link.type === LinkType.EVENT || link.type === LinkType.EXCEPTION) {
      return (
        <Group key={link.id}>
          <Arrow
            points={[fromX, fromY, toX, toY]}
            {...commonProps}
            fill={linkColor}
            pointerLength={12}
            pointerWidth={10}
          />
          <Group x={fromX} y={fromY} rotation={(angle * 180) / Math.PI}>
            <KonvaCircle radius={8} fill="white" stroke={linkColor} strokeWidth={2} />
            {link.type === LinkType.EVENT && (
              <Arrow points={[-4, 0, 4, 0]} fill={linkColor} stroke={linkColor} strokeWidth={1} pointerLength={4} pointerWidth={4} />
            )}
            {link.type === LinkType.EXCEPTION && (
              <Group>
                <Line points={[-4, -4, 4, 4]} stroke={linkColor} strokeWidth={2} />
                <Line points={[-4, 4, 4, -4]} stroke={linkColor} strokeWidth={2} />
              </Group>
            )}
          </Group>
          {renderCardinality()}
          {renderHandles()}
        </Group>
      );
    }

    return <Line key={link.id} points={[fromX, fromY, toX, toY]} {...commonProps} />;
  };

  const renderElement = (el: LogicalElement) => {
    const visualEl = currentOpd.visual.elements.find(v => v.id === el.id);
    if (!visualEl) return null;

    const isSelected = selectedId === el.id;
    const isParentProcess = el.id === currentOpd.parentProcessId;
    const children = model.logical.elements.filter(child => child.parentId === el.id);
    
    return (
      <Group 
        id={el.id}
        key={el.id} 
        x={visualEl.x} 
        y={visualEl.y} 
        draggable={tool === 'select'} 
        onDragStart={pushToHistory}
        onDragMove={(e) => {
          if (e.target.id() === el.id) {
            handleElementDragMove(el.id, e);
          }
        }}
        onDragEnd={(e) => {
          if (e.target.id() === el.id) {
            handleDragEnd(el.id, e);
          }
        }} 
        onClick={(e) => {
          // Do not cancel click bubble when adding new elements so handleStageClick can be triggered on stage
          if (tool !== ElementType.OBJECT && tool !== ElementType.PROCESS) {
            e.cancelBubble = true;
          }
          handleElementClick(el.id);
        }}
        onTransformEnd={handleTransformEnd}
      >
        {el.type === ElementType.OBJECT ? (
          <Rect 
            width={visualEl.width} 
            height={visualEl.height} 
            fill="white" 
            stroke={isSelected ? '#4f46e5' : '#1e293b'} 
            strokeWidth={isSelected ? 3 : 2} 
            dash={el.affiliation === 'ENVIRONMENTAL' ? [5, 5] : undefined}
            cornerRadius={2} 
            shadowBlur={el.essence === 'PHYSICAL' ? 10 : (isSelected ? 15 : 0)} 
            shadowColor={el.essence === 'PHYSICAL' ? "#000000" : "#4f46e5"} 
            shadowOpacity={el.essence === 'PHYSICAL' ? 0.4 : 0.2} 
            shadowOffset={el.essence === 'PHYSICAL' ? { x: 4, y: 4 } : { x: 0, y: 0 }}
          />
        ) : el.type === ElementType.PROCESS ? (
          <Ellipse 
            radiusX={visualEl.width / 2} 
            radiusY={visualEl.height / 2} 
            x={visualEl.width / 2} 
            y={visualEl.height / 2} 
            fill={isParentProcess ? "#f8fafc" : "white"} 
            stroke={isSelected ? '#4f46e5' : (isParentProcess ? '#cbd5e1' : '#1e293b')} 
            strokeWidth={isSelected ? 3 : (isParentProcess ? 1 : 2)} 
            dash={isParentProcess ? [10, 5] : (el.affiliation === 'ENVIRONMENTAL' ? [5, 5] : undefined)}
            shadowBlur={el.essence === 'PHYSICAL' ? 10 : (isSelected ? 15 : 0)} 
            shadowColor={el.essence === 'PHYSICAL' ? "#000000" : "#4f46e5"} 
            shadowOpacity={el.essence === 'PHYSICAL' ? 0.4 : 0.2} 
            shadowOffset={el.essence === 'PHYSICAL' ? { x: 4, y: 4 } : { x: 0, y: 0 }}
          />
        ) : (
          <Group>
            {el.isFinal && (
              <Rect 
                width={visualEl.width + 6} 
                height={visualEl.height + 6} 
                x={-3}
                y={-3}
                fill="transparent" 
                stroke={isSelected ? '#4f46e5' : '#64748b'} 
                strokeWidth={1} 
                cornerRadius={10} 
              />
            )}
            <Rect 
              width={visualEl.width} 
              height={visualEl.height} 
              fill="white" 
              stroke={isSelected ? '#4f46e5' : '#64748b'} 
              strokeWidth={el.isInitial ? 3 : (isSelected ? 2 : 1)} 
              cornerRadius={8} 
            />
          </Group>
        )}
        <Text 
          text={el.name} 
          width={visualEl.width} 
          height={visualEl.height} 
          align="center" 
          verticalAlign="middle" 
          fontSize={isParentProcess ? 18 : (el.parentId ? 10 : 14)} 
          fontStyle={isParentProcess ? "bold" : (el.parentId ? "normal" : "bold")} 
          fill={el.type === ElementType.STATE ? "#475569" : "#1e293b"} 
          padding={5} 
        />
        {children
          .filter(child => currentOpd.visual.elements.some(ve => ve.id === child.id))
          .map(renderElement)}
      </Group>
    );
  };

  return (
    <div 
      className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <OPMIcon className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">OPM-Pro v1</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Undo/Redo & Layout controls */}
          <div className="flex items-center gap-1 bg-slate-100/60 border border-slate-200 p-1 rounded-2xl mr-2 shadow-inner">
            <button 
              disabled={history.length === 0}
              onClick={undo}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 disabled:text-slate-400 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:bg-transparent shadow-sm disabled:shadow-none text-xs font-bold font-sans border border-slate-200/50"
              title="Undo Action (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" /> Undo
            </button>
            <button 
              disabled={redoHistory.length === 0}
              onClick={redo}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 disabled:text-slate-400 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:bg-transparent shadow-sm disabled:shadow-none text-xs font-bold font-sans border border-slate-200/50"
              title="Redo Action (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" /> Redo
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button 
              onClick={autoLayout}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-50 text-indigo-700 rounded-xl transition-colors shadow-sm text-xs font-bold font-sans border border-indigo-100"
              title="Auto-Arrange Diagram Layout"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Auto Layout
            </button>
          </div>

          <button 
            onClick={startTutorialIndex}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors shadow-sm font-semibold text-sm border border-indigo-200"
            title="Start Step-by-Step Interactive Tutorial"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" /> Tutorial
          </button>
          <button 
            onClick={() => setIsManageTagsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm border border-slate-200"
            title="Manage and Rename Structural Relation Tags"
          >
            <Tag className="w-4 h-4 text-indigo-600" /> Tags
          </button>
          <button 
            onClick={() => setIsExampleLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm border border-slate-200"
          >
            <Library className="w-4 h-4" /> Library
          </button>
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm border border-slate-200"
          >
            <HelpCircle className="w-4 h-4" /> Help
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm cursor-pointer border border-slate-200">
            <Share2 className="w-4 h-4" /> Import Model
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={exportModel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Download className="w-4 h-4" /> Export Model
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-4 shrink-0 shadow-sm overflow-y-auto">
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 className="w-5 h-5" />} label="Select" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton id="tool-btn-OBJECT" active={tool === ElementType.OBJECT} onClick={() => setTool(ElementType.OBJECT)} icon={<Square className="w-5 h-5" />} label="Object" />
          <ToolButton id="tool-btn-PROCESS" active={tool === ElementType.PROCESS} onClick={() => setTool(ElementType.PROCESS)} icon={<svg className="w-6 h-4" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="8" rx="10" ry="6" stroke="currentColor" strokeWidth="2" /></svg>} label="Process" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton active={tool === LinkType.AGENT} onClick={() => setTool(LinkType.AGENT)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-600 rounded-full" /></div>} label="Agent" />
          <ToolButton id="tool-btn-INSTRUMENT" active={tool === LinkType.INSTRUMENT} onClick={() => setTool(LinkType.INSTRUMENT)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full" />} label="Instrument" />
          <ToolButton active={tool === LinkType.CONDITION} onClick={() => setTool(LinkType.CONDITION)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold">c</div>} label="Condition" />
          <ToolButton active={tool === LinkType.EVENT} onClick={() => setTool(LinkType.EVENT)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold">e</div>} label="Event" />
          <ToolButton active={tool === LinkType.EXCEPTION} onClick={() => setTool(LinkType.EXCEPTION)} icon={<div className="w-5 h-5 border-2 border-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold">x</div>} label="Exception" />
          <ToolButton id="tool-btn-INVOCATION" active={tool === LinkType.INVOCATION} onClick={() => setTool(LinkType.INVOCATION)} icon={<Zap className="w-5 h-5" />} label="Invoke" />
          <ToolButton active={tool === 'procedural'} onClick={() => setTool('procedural')} icon={<ArrowRight className="w-5 h-5" />} label="Procedural" />
          <ToolButton active={tool === LinkType.EFFECT} onClick={() => setTool(LinkType.EFFECT)} icon={<div className="flex items-center"><ArrowRight className="w-3 h-3 -mr-1" /><ArrowRight className="w-3 h-3 rotate-180" /></div>} label="Effect" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton id="tool-btn-AGGREGATION" active={tool === LinkType.AGGREGATION} onClick={() => setTool(LinkType.AGGREGATION)} icon={<svg viewBox="0 0 24 24" className="w-5 h-5 animate-none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 L2 20 H22 Z" fill="currentColor" /><text x="12" y="16.5" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">A</text></svg>} label="Aggregation" />
          <ToolButton id="tool-btn-EXHIBITION" active={tool === LinkType.EXHIBITION} onClick={() => setTool(LinkType.EXHIBITION)} icon={<svg viewBox="0 0 24 24" className="w-5 h-5 animate-none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 L2 20 H22 Z" fill="currentColor" /><path d="M12 7 L5.5 18 H18.5 Z" fill="white" /><text x="12" y="15.5" fill="currentColor" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">E</text></svg>} label="Exhibition" />
          <ToolButton id="tool-btn-GENERALIZATION" active={tool === LinkType.GENERALIZATION} onClick={() => setTool(LinkType.GENERALIZATION)} icon={<svg viewBox="0 0 24 24" className="w-5 h-5 animate-none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3 L3 20 H21 Z" stroke="currentColor" strokeWidth="2.5" fill="white" /><text x="12" y="16" fill="currentColor" fontSize="12" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">G</text></svg>} label="Generalization" />
          <ToolButton id="tool-btn-INSTANTIATION" active={tool === LinkType.INSTANTIATION} onClick={() => setTool(LinkType.INSTANTIATION)} icon={<svg viewBox="0 0 24 24" className="w-5 h-5 animate-none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 L2 20 H22 Z" fill="currentColor" /><circle cx="12" cy="14" r="5" fill="white" /><text x="12" y="17.2" fill="currentColor" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">I</text></svg>} label="Instantiation" />
          <ToolButton id="tool-btn-TAGGED_STRUCTURAL" active={tool === LinkType.TAGGED_STRUCTURAL} onClick={() => setTool(LinkType.TAGGED_STRUCTURAL)} icon={<Tag className="w-5 h-5" />} label="Tagged Link" />
          <div className="w-10 h-px bg-slate-100 mx-auto" />
          <ToolButton active={isAddExistingOpen} onClick={() => setIsAddExistingOpen(true)} icon={<Plus className="w-5 h-5" />} label="Add Existing" />
          <div className="mt-auto pt-4 border-t border-slate-100 w-full flex flex-col items-center gap-4">
            <button onClick={() => {
              const sdId = uuidv4();
              updateModel({ 
                logical: { elements: [], links: [] }, 
                opds: [{ id: sdId, name: 'SD', visual: { elements: [], links: [] } }],
                currentOpdId: sdId
              });
            }} className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Clear Canvas"><Plus className="w-5 h-5 rotate-45" /></button>
            <button onClick={deleteSelected} disabled={!selectedId && !selectedLinkId} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"><Trash2 className="w-5 h-5" /></button>
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-50 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <select 
              value={model.currentOpdId}
              onChange={(e) => setModel(prev => ({ ...prev, currentOpdId: e.target.value }))}
              className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-indigo-600 outline-none"
            >
              {model.opds.map(opd => (
                <option key={opd.id} value={opd.id}>{opd.name}</option>
              ))}
            </select>
            {currentOpd.parentProcessId && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <button 
                  onClick={zoomOut} 
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all"
                  title="Zoom Out to Parent OPD"
                >
                  <ArrowUpLeft className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          <Stage width={stageSize.width} height={stageSize.height} onClick={handleStageClick} ref={stageRef}>
            <Layer>
              {model.logical.elements
                .filter(el => currentOpd.visual.elements.some(ve => ve.id === el.id))
                .filter(el => !el.parentId || !currentOpd.visual.elements.some(ve => ve.id === el.parentId))
                .map(renderElement)}
              {model.logical.links.filter(l => currentOpd.visual.links.some(vl => vl.id === l.id)).map(renderLink)}
              {selectedId && tool === 'select' && (
                <Transformer
                  nodes={stageRef.current ? [stageRef.current.findOne('#' + selectedId)].filter(Boolean) : []}
                  padding={5}
                  rotateEnabled={false}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 40 || newBox.height < 40) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
          {linkingSource && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-pulse flex items-center gap-3 border border-indigo-400 z-20">
              <Plus className="w-4 h-4" /> {
                tool === LinkType.TAGGED_STRUCTURAL ? 'Select target Object to complete Tagged Link' :
                tool === LinkType.INVOCATION ? 'Select target Process to complete Invocation' : 
                'Select target element to complete link'
              }
            </div>
          )}
          {tool !== 'select' && !linkingSource && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white text-indigo-600 px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-3 border border-indigo-100 z-20">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
              {tool === ElementType.OBJECT || tool === ElementType.PROCESS ? `Click on canvas to place ${tool}` : 
               tool === LinkType.TAGGED_STRUCTURAL ? 'Select source Object for Tagged Link' :
               tool === LinkType.INVOCATION ? 'Select source Process for Invocation' : 
               'Select source element for link'}
            </div>
          )}
        </main>

        <aside id="properties-sidebar" className="w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Properties
            </h2>
            {selectedId ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Name</label>
                  <div className="relative group">
                    <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      value={model.logical.elements.find(e => e.id === selectedId)?.name || ''} 
                      onFocus={pushToHistory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModel(prev => ({
                          ...prev,
                          logical: {
                            ...prev.logical,
                            elements: prev.logical.elements.map(el => el.id === selectedId ? { ...el, name: val } : el)
                          }
                        }));
                      }} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Type</label>
                    <div className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200">
                      {model.logical.elements.find(e => e.id === selectedId)?.type}
                    </div>
                  </div>
                  {model.logical.elements.find(e => e.id === selectedId)?.type === ElementType.OBJECT && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Actions</label>
                      <button onClick={() => {
                        const id = uuidv4();
                        const newLogical: LogicalElement = {
                          id,
                          type: ElementType.STATE,
                          name: 'New State',
                          essence: Essence.INFORMATIONAL,
                          affiliation: Affiliation.SYSTEMIC,
                          parentId: selectedId
                        };
                        const newVisual: VisualElement = {
                          id,
                          x: 10,
                          y: 10,
                          width: 100,
                          height: 35,
                          parentId: selectedId
                        };
                        updateModel(prev => ({
                          ...prev,
                          logical: { ...prev.logical, elements: [...prev.logical.elements, newLogical] },
                          opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
                            ...o,
                            visual: { ...o.visual, elements: [...o.visual.elements, newVisual] }
                          } : o)
                        }));
                      }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add State
                      </button>
                    </div>
                  )}
                  {model.logical.elements.find(e => e.id === selectedId)?.type === ElementType.PROCESS && (
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Hierarchy</label>
                        <button 
                          onClick={() => zoomIn(selectedId)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold shadow-sm"
                        >
                          <Maximize2 className="w-3.5 h-3.5" /> Zoom In
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Sub-Process</label>
                        <button onClick={() => {
                          const id = uuidv4();
                          const newLogical: LogicalElement = {
                            id,
                            type: ElementType.PROCESS,
                            name: 'New Subprocess',
                            essence: Essence.INFORMATIONAL,
                            affiliation: Affiliation.SYSTEMIC,
                            parentId: selectedId
                          };
                          const newVisual: VisualElement = {
                            id,
                            x: 20,
                            y: 20,
                            width: 140,
                            height: 70,
                            parentId: selectedId
                          };
                          updateModel(prev => {
                            const updatedOpds = prev.opds.map(o => {
                              if (o.id === prev.currentOpdId) {
                                const updatedVisualElements = o.visual.elements.map(el => el.id === selectedId ? { ...el, isExpanded: true } : el);
                                return {
                                  ...o,
                                  visual: {
                                    ...o.visual,
                                    elements: [...updatedVisualElements, newVisual]
                                  }
                                };
                              }
                              return o;
                            });
                            return {
                              ...prev,
                              logical: { ...prev.logical, elements: [...prev.logical.elements, newLogical] },
                              opds: updatedOpds
                            };
                          });
                        }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold shadow-sm">
                          <Plus className="w-3.5 h-3.5" /> Add Subprocess
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Essence</label>
                      <select 
                        value={model.logical.elements.find(e => e.id === selectedId)?.essence}
                        onChange={(e) => {
                          const val = e.target.value as Essence;
                          updateModel(prev => ({
                            ...prev,
                            logical: {
                              ...prev.logical,
                              elements: prev.logical.elements.map(el => el.id === selectedId ? { ...el, essence: val } : el)
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value={Essence.INFORMATIONAL}>Informational</option>
                        <option value={Essence.PHYSICAL}>Physical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Affiliation</label>
                      <select 
                        value={model.logical.elements.find(e => e.id === selectedId)?.affiliation}
                        onChange={(e) => {
                          const val = e.target.value as Affiliation;
                          updateModel(prev => ({
                            ...prev,
                            logical: {
                              ...prev.logical,
                              elements: prev.logical.elements.map(el => el.id === selectedId ? { ...el, affiliation: val } : el)
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value={Affiliation.SYSTEMIC}>Systemic</option>
                        <option value={Affiliation.ENVIRONMENTAL}>Environmental</option>
                      </select>
                    </div>
                  </div>

                  {model.logical.elements.find(e => e.id === selectedId)?.type === ElementType.STATE && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all">
                        <input 
                          type="checkbox" 
                          checked={model.logical.elements.find(e => e.id === selectedId)?.isInitial || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateModel(prev => ({
                              ...prev,
                              logical: {
                                ...prev.logical,
                                elements: prev.logical.elements.map(el => el.id === selectedId ? { ...el, isInitial: checked } : el)
                              }
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Initial State</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all">
                        <input 
                          type="checkbox" 
                          checked={model.logical.elements.find(e => e.id === selectedId)?.isFinal || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateModel(prev => ({
                              ...prev,
                              logical: {
                                ...prev.logical,
                                elements: prev.logical.elements.map(el => el.id === selectedId ? { ...el, isFinal: checked } : el)
                              }
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Final State</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all">
                        <input 
                          type="checkbox" 
                          checked={model.logical.elements.find(e => e.id === selectedId)?.isDefault || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateModel(prev => ({
                              ...prev,
                              logical: {
                                ...prev.logical,
                                elements: prev.logical.elements.map(el => el.id === selectedId ? { ...el, isDefault: checked } : el)
                              }
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Default State</span>
                      </label>
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={deleteSelected}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Element
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedLinkId ? (
              (() => {
                const selectedLink = model.logical.links.find(l => l.id === selectedLinkId);
                if (!selectedLink) return null;
                const visualLink = currentOpd.visual.links.find(vl => vl.id === selectedLinkId);
                const isTagged = selectedLink.type === LinkType.TAGGED_STRUCTURAL;
                const currentTag = selectedLink.tag || 'supports';
                const tagStyle = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === currentTag.toLowerCase());
                const effectiveColor = tagStyle?.color || '#2563eb';
                const effectiveLineStyle = tagStyle?.lineStyle || 'solid';
                const isTagLabelGloballyVisible = tagStyle ? tagStyle.showTagLabel !== false : true;
                const isThisLinkTagVisible = visualLink?.showTagLabel !== undefined 
                  ? visualLink.showTagLabel 
                  : isTagLabelGloballyVisible;
                
                const availableTags = model.logical.tags || [];

                return (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Link Type</label>
                      <select 
                        value={selectedLink.type}
                        onChange={(e) => {
                          const val = e.target.value as LinkType;
                          updateModel(prev => {
                            let updatedTags = prev.logical.tags ? [...prev.logical.tags] : [];
                            const defaultTag = updatedTags[0]?.name || 'supports';
                            if (!updatedTags.some(t => t.name.toLowerCase() === defaultTag.toLowerCase())) {
                              updatedTags.push({
                                id: uuidv4(),
                                name: defaultTag
                              });
                            }

                            let updatedLinks = prev.logical.links.map(l => {
                              if (l.id === selectedLinkId) {
                                const newLink = { ...l, type: val };
                                if (val === LinkType.TAGGED_STRUCTURAL && !newLink.tag) {
                                  newLink.tag = defaultTag;
                                }
                                return newLink;
                              }
                              return l;
                            });

                            const updatedOpds = prev.opds.map(o => {
                              if (o.id === prev.currentOpdId) {
                                const styles = o.visual.tagStyles || [];
                                if (!styles.some(ts => ts.tag.toLowerCase() === defaultTag.toLowerCase())) {
                                  return {
                                    ...o,
                                    visual: {
                                      ...o.visual,
                                      tagStyles: [...styles, { tag: defaultTag, color: '#2563eb', lineStyle: 'solid' as TagLineStyle, showTagLabel: true }]
                                    }
                                  };
                                }
                              }
                              return o;
                            });

                            return {
                              ...prev,
                              logical: {
                                ...prev.logical,
                                tags: updatedTags,
                                links: updatedLinks
                              },
                              opds: updatedOpds
                            };
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <optgroup label="Structural">
                          <option value={LinkType.AGGREGATION}>Aggregation</option>
                          <option value={LinkType.EXHIBITION}>Exhibition</option>
                          <option value={LinkType.GENERALIZATION}>Generalization</option>
                          <option value={LinkType.INSTANTIATION}>Instantiation</option>
                          <option value={LinkType.TAGGED_STRUCTURAL}>Tagged Structural</option>
                        </optgroup>
                        <optgroup label="Procedural">
                          <option value={LinkType.AGENT}>Agent</option>
                          <option value={LinkType.INSTRUMENT}>Instrument</option>
                          <option value={LinkType.CONSUMPTION}>Consumption</option>
                          <option value={LinkType.RESULT}>Result</option>
                          <option value={LinkType.EFFECT}>Effect</option>
                          <option value={LinkType.CONDITION}>Condition</option>
                          <option value={LinkType.EVENT}>Event</option>
                          <option value={LinkType.EXCEPTION}>Exception</option>
                          <option value={LinkType.INVOCATION}>Invocation</option>
                        </optgroup>
                      </select>
                    </div>

                    {isTagged && (
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        {(() => {
                          const matchingRelations = model.logical.links.filter(
                            l => l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim().toLowerCase() === currentTag.toLowerCase()
                          );
                          const matchingCount = matchingRelations.length;

                          return (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-semibold text-slate-500 uppercase">Tag Name (Relation)</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenameInputVal(currentTag);
                                      setRenameTagModal({ isOpen: true, oldTag: currentTag });
                                    }}
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                    title={`Rename '${currentTag}' across all relations in the model`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Rename for all ({matchingCount})</span>
                                  </button>
                                </div>
                                <input 
                                  type="text"
                                  value={selectedLink.tag || ''}
                                  onFocus={pushToHistory}
                                  onChange={(e) => {
                                    const newTag = e.target.value;
                                    updateModel(prev => {
                                      const existingTags = prev.logical.tags || [];
                                      let updatedTags = existingTags;
                                      if (newTag.trim() && !existingTags.some(t => t.name.toLowerCase() === newTag.trim().toLowerCase())) {
                                        updatedTags = [...existingTags, { id: uuidv4(), name: newTag.trim() }];
                                      }
                                      return {
                                        ...prev,
                                        logical: {
                                          ...prev.logical,
                                          tags: updatedTags,
                                          links: prev.logical.links.map(l => l.id === selectedLinkId ? { ...l, tag: newTag } : l)
                                        }
                                      };
                                    });
                                  }}
                                  placeholder="e.g. supports, contains"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                {matchingCount > 1 && (
                                  <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-slate-600">
                                      <span className="font-semibold text-indigo-900">{matchingCount} relations</span> share tag <span className="font-semibold text-indigo-700">'{currentTag}'</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRenameInputVal(currentTag);
                                        setRenameTagModal({ isOpen: true, oldTag: currentTag });
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold rounded-lg text-[11px] transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
                                      title="Rename all relations with this tag"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Rename All
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Reusable Tags list */}
                              {availableTags.length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reuse Existing Tag</span>
                                    <button
                                      type="button"
                                      onClick={() => setIsManageTagsOpen(true)}
                                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                                      title="Manage all tags in model"
                                    >
                                      <Tag className="w-3 h-3" />
                                      <span>Manage Tags</span>
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {availableTags.map(t => {
                                      const isCurrent = t.name.toLowerCase() === currentTag.toLowerCase();
                                      const currentTagStyle = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === t.name.toLowerCase());
                                      return (
                                        <div key={t.id} className="inline-flex items-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateModel(prev => ({
                                                ...prev,
                                                logical: {
                                                  ...prev.logical,
                                                  links: prev.logical.links.map(l => l.id === selectedLinkId ? { ...l, tag: t.name } : l)
                                                }
                                              }));
                                            }}
                                            className={`px-2.5 py-1 rounded-l-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-r-0 ${
                                              isCurrent 
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                          >
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentTagStyle?.color || '#2563eb' }} />
                                            <span>{t.name}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRenameInputVal(t.name);
                                              setRenameTagModal({ isOpen: true, oldTag: t.name });
                                            }}
                                            title={`Rename tag '${t.name}' across all relations`}
                                            className={`px-1.5 py-1 rounded-r-lg text-xs font-semibold transition-all border border-l-slate-200/50 ${
                                              isCurrent
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                                                : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                                            }`}
                                          >
                                            <Edit3 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Visual Representation for all links with this tag */}
                              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">Tag Style ({currentTag})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenameInputVal(currentTag);
                                      setRenameTagModal({ isOpen: true, oldTag: currentTag });
                                    }}
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Rename Tag</span>
                                  </button>
                                </div>

                          {/* Live preview banner */}
                          <div className="h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center relative px-4 overflow-hidden">
                            <svg className="w-full h-8" viewBox="0 0 200 32">
                              <line 
                                x1="20" y1="16" x2="175" y2="16" 
                                stroke={effectiveColor} 
                                strokeWidth="2" 
                                strokeDasharray={
                                  effectiveLineStyle === 'dashed' ? '6,4' :
                                  effectiveLineStyle === 'dotted' ? '2,3' :
                                  effectiveLineStyle === 'dash-dot' ? '8,3,2,3' : undefined
                                }
                              />
                              <polygon points="175,12 185,16 175,20" fill={effectiveColor} />
                              {isTagLabelGloballyVisible && currentTag && (
                                <g transform="translate(100, 16)">
                                  <rect 
                                    x={-(Math.max(48, currentTag.length * 7 + 16)) / 2} 
                                    y="-10" 
                                    width={Math.max(48, currentTag.length * 7 + 16)} 
                                    height="20" 
                                    rx="5" 
                                    fill="white" 
                                    stroke={effectiveColor} 
                                    strokeWidth="1.5" 
                                  />
                                  <text 
                                    x="0" 
                                    y="3.5" 
                                    fill={effectiveColor} 
                                    fontSize="10" 
                                    fontWeight="bold" 
                                    fontStyle="italic" 
                                    textAnchor="middle"
                                  >
                                    {currentTag}
                                  </text>
                                </g>
                              )}
                            </svg>
                          </div>

                          {/* Color swatches */}
                          <div>
                            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Color</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[
                                { name: 'Blue', hex: '#2563eb' },
                                { name: 'Indigo', hex: '#4f46e5' },
                                { name: 'Cyan', hex: '#0891b2' },
                                { name: 'Emerald', hex: '#059669' },
                                { name: 'Amber', hex: '#d97706' },
                                { name: 'Rose', hex: '#e11d48' },
                                { name: 'Purple', hex: '#9333ea' },
                                { name: 'Slate', hex: '#475569' },
                              ].map(c => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => updateTagVisual(currentTag, { color: c.hex })}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                    effectiveColor.toLowerCase() === c.hex.toLowerCase() 
                                      ? 'border-slate-800 scale-110 shadow-xs' 
                                      : 'border-white hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                              <input 
                                type="color" 
                                value={effectiveColor}
                                onChange={(e) => updateTagVisual(currentTag, { color: e.target.value })}
                                className="w-6 h-6 p-0 border border-slate-200 rounded cursor-pointer bg-transparent"
                                title="Custom Color"
                              />
                            </div>
                          </div>

                          {/* Line Style Selector */}
                          <div>
                            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Line Pattern</span>
                            <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
                              {(['solid', 'dashed', 'dotted', 'dash-dot'] as TagLineStyle[]).map(style => (
                                <button
                                  key={style}
                                  type="button"
                                  onClick={() => updateTagVisual(currentTag, { lineStyle: style })}
                                  className={`py-1 rounded text-center capitalize transition-all ${
                                    effectiveLineStyle === style 
                                      ? 'bg-indigo-600 text-white shadow-xs' 
                                      : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  {style === 'dash-dot' ? 'Dash-Dot' : style}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Global Tag Visibility Toggle */}
                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-semibold text-slate-700">Show label for all '{currentTag}' links</span>
                            <input 
                              type="checkbox"
                              checked={isTagLabelGloballyVisible}
                              onChange={(e) => setAllLinksTagVisibility(currentTag, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </label>
                        </div>

                        {/* Individual Link Visibility Toggle */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-xs font-semibold text-slate-800 block">This Link's Label</span>
                              <span className="text-[11px] text-slate-400">Convey '{currentTag}' on canvas</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={isThisLinkTagVisible}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateModel(prev => ({
                                  ...prev,
                                  opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
                                    ...o,
                                    visual: {
                                      ...o.visual,
                                      links: o.visual.links.map(vl => vl.id === selectedLinkId ? { ...vl, showTagLabel: checked } : vl)
                                    }
                                  } : o)
                                }));
                              }}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </label>
                          {visualLink?.showTagLabel !== undefined && visualLink.showTagLabel !== isTagLabelGloballyVisible && (
                            <button
                              type="button"
                              onClick={() => {
                                updateModel(prev => ({
                                  ...prev,
                                  opds: prev.opds.map(o => o.id === prev.currentOpdId ? {
                                    ...o,
                                    visual: {
                                      ...o.visual,
                                      links: o.visual.links.map(vl => {
                                        if (vl.id === selectedLinkId) {
                                          const { showTagLabel: _, ...rest } = vl;
                                          return rest;
                                        }
                                        return vl;
                                      })
                                    }
                                  } : o)
                                }));
                              }}
                              className="text-[11px] text-indigo-600 hover:underline font-medium"
                            >
                              Reset to tag's global visibility ({isTagLabelGloballyVisible ? 'visible' : 'hidden'})
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Source Cardinality</label>
                      <input 
                        type="text" 
                        value={selectedLink.sourceCardinality || ''}
                        onFocus={pushToHistory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModel(prev => ({
                            ...prev,
                            logical: {
                              ...prev.logical,
                              links: prev.logical.links.map(l => l.id === selectedLinkId ? { ...l, sourceCardinality: val } : l)
                            }
                          }));
                        }}
                        placeholder="e.g. 1, 0..*, n"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Target Cardinality</label>
                      <input 
                        type="text" 
                        value={selectedLink.targetCardinality || ''}
                        onFocus={pushToHistory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModel(prev => ({
                            ...prev,
                            logical: {
                              ...prev.logical,
                              links: prev.logical.links.map(l => l.id === selectedLinkId ? { ...l, targetCardinality: val } : l)
                            }
                          }));
                        }}
                        placeholder="e.g. 1, 0..*, n"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button onClick={deleteSelected} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold border border-red-200">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Link
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <MousePointer2 className="w-6 h-6 opacity-20" />
                </div>
                <p className="text-sm italic">Select an element on the canvas to view and edit its properties</p>
              </div>
            )}
          </div>

          <div id="opl-panel" className="flex-1 flex flex-col overflow-hidden border-t border-slate-100">
            <div className="p-6 pb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> OPL
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setOplMode('diagram')}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    oplMode === 'diagram' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Diagram
                </button>
                <button 
                  onClick={() => setOplMode('full')}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    oplMode === 'full' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Full Model
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
              {oplSentences.length > 0 ? (
                oplSentences.map((sentence, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 text-sm leading-relaxed hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all cursor-default group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-indigo-400 font-mono mr-3 text-xs font-bold opacity-40 group-hover:opacity-100 transition-opacity">{String(i + 1).padStart(2, '0')}</span>
                    {sentence}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-sm italic">Add elements and links to generate natural language descriptions</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      {/* Example Library Modal */}
      {isExampleLibraryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Library className="text-indigo-600 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Example Library</h2>
                  <p className="text-sm text-slate-500">Choose a template to start with</p>
                </div>
              </div>
              <button onClick={() => setIsExampleLibraryOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPM_EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    updateModel(normalizeOPMModel(example.model));
                    setIsExampleLibraryOpen(false);
                  }}
                  className="flex flex-col text-left p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{example.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{example.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onStartTutorial={startTutorialIndex} />

      {/* Add Existing Element Modal */}
      {isAddExistingOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Plus className="text-indigo-600 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Add Existing</h2>
                    <p className="text-sm text-slate-500">Import elements or relations to this diagram</p>
                  </div>
                </div>
                <button onClick={() => {
                  setIsAddExistingOpen(false);
                  setSelectedAddExistingIds([]);
                }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button 
                  onClick={() => {
                    setAddExistingTab('elements');
                    setSelectedAddExistingIds([]);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    addExistingTab === 'elements' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Elements
                </button>
                <button 
                  onClick={() => {
                    setAddExistingTab('links');
                    setSelectedAddExistingIds([]);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    addExistingTab === 'links' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Relations
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-2">
              {addExistingTab === 'elements' ? (
                <>
                  {model.logical.elements
                    .filter(el => el.type !== ElementType.STATE)
                    .map(el => {
                      const isVisible = currentOpd.visual.elements.some(ve => ve.id === el.id);
                      const isSelected = selectedAddExistingIds.includes(el.id);
                      return (
                        <button
                          key={el.id}
                          onClick={() => toggleAddExistingSelection(el.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                            isVisible ? "bg-slate-50 border-slate-100 opacity-60" : 
                            isSelected ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20" :
                            "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              el.type === ElementType.OBJECT ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                            )}>
                              {el.type === ElementType.OBJECT ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{el.name}</div>
                              <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{el.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isVisible && <div className="text-[10px] font-bold text-slate-400 uppercase">Visible</div>}
                            {isSelected && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                          </div>
                        </button>
                      );
                    })}
                  {model.logical.elements.filter(el => el.type !== ElementType.STATE).length === 0 && (
                    <div className="text-center py-8 text-slate-400 italic">No elements available</div>
                  )}
                </>
              ) : (
                <>
                  {model.logical.links
                    .filter(l => {
                      const sourceVisible = currentOpd.visual.elements.some(ve => ve.id === l.sourceId) || l.sourceId === currentOpd.parentProcessId;
                      const targetVisible = currentOpd.visual.elements.some(ve => ve.id === l.targetId) || l.targetId === currentOpd.parentProcessId;
                      const linkVisible = currentOpd.visual.links.some(vl => vl.id === l.id);
                      return sourceVisible && targetVisible && !linkVisible;
                    })
                    .map(l => {
                      const source = model.logical.elements.find(e => e.id === l.sourceId) || (l.sourceId === currentOpd.parentProcessId ? model.logical.elements.find(e => e.id === currentOpd.parentProcessId) : null);
                      const target = model.logical.elements.find(e => e.id === l.targetId) || (l.targetId === currentOpd.parentProcessId ? model.logical.elements.find(e => e.id === currentOpd.parentProcessId) : null);
                      const isSelected = selectedAddExistingIds.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => toggleAddExistingSelection(l.id)}
                          className={cn(
                            "w-full flex flex-col p-3 rounded-xl border transition-all text-left",
                            isSelected ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20" : "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                              {l.type === LinkType.TAGGED_STRUCTURAL ? (l.tag ? `TAGGED: ${l.tag}` : 'TAGGED LINK') : l.type}
                            </span>
                            {isSelected && <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                          </div>
                          <div className="text-sm text-slate-600">
                            <span className="font-bold text-slate-900">{source?.name || 'Unknown'}</span>
                            <ArrowRight className="inline w-3 h-3 mx-2 text-slate-400" />
                            <span className="font-bold text-slate-900">{target?.name || 'Unknown'}</span>
                          </div>
                        </button>
                      );
                    })}
                  {model.logical.links.filter(l => {
                    const sourceVisible = currentOpd.visual.elements.some(ve => ve.id === l.sourceId) || l.sourceId === currentOpd.parentProcessId;
                    const targetVisible = currentOpd.visual.elements.some(ve => ve.id === l.targetId) || l.targetId === currentOpd.parentProcessId;
                    const linkVisible = currentOpd.visual.links.some(vl => vl.id === l.id);
                    return sourceVisible && targetVisible && !linkVisible;
                  }).length === 0 && (
                    <div className="text-center py-8 text-slate-400 italic">No importable relations found</div>
                  )}
                </>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => {
                  setIsAddExistingOpen(false);
                  setSelectedAddExistingIds([]);
                }}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkAddExisting}
                disabled={selectedAddExistingIds.length === 0}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
              >
                Add Selected ({selectedAddExistingIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {taggedLinkDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Tagged Structural Link</h2>
                  <p className="text-xs text-slate-500">
                    Connect <span className="font-semibold text-slate-800">{taggedLinkDialog.sourceName}</span> to <span className="font-semibold text-slate-800">{taggedLinkDialog.targetName}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTaggedLinkDialog(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Tag Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tag Name (Relation)</label>
                <input
                  type="text"
                  value={selectedTagInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTagInput(val);
                    const tagStyle = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === val.trim().toLowerCase());
                    if (tagStyle) {
                      setNewTagColor(tagStyle.color || '#2563eb');
                      setNewTagLineStyle(tagStyle.lineStyle || 'solid');
                      setNewTagShowLabel(tagStyle.showTagLabel !== false);
                    }
                  }}
                  placeholder="e.g. supports, contains, manages"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Reusable Tags */}
              {(model.logical.tags && model.logical.tags.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Or Select Existing Tag</label>
                    <button
                      type="button"
                      onClick={() => setIsManageTagsOpen(true)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Manage Tags</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {model.logical.tags.map(t => {
                      const isSelected = selectedTagInput.trim().toLowerCase() === t.name.toLowerCase();
                      const tagStyle = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === t.name.toLowerCase());
                      return (
                        <div key={t.id} className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTagInput(t.name);
                              setNewTagColor(tagStyle?.color || '#2563eb');
                              setNewTagLineStyle(tagStyle?.lineStyle || 'solid');
                              setNewTagShowLabel(tagStyle?.showTagLabel !== false);
                            }}
                            className={`px-3 py-1.5 rounded-l-xl text-xs font-semibold flex items-center gap-2 transition-all border border-r-0 ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: isSelected ? '#ffffff' : (tagStyle?.color || '#2563eb') }} 
                            />
                            <span>{t.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameInputVal(t.name);
                              setRenameTagModal({ isOpen: true, oldTag: t.name });
                            }}
                            title={`Rename tag '${t.name}' across all relations`}
                            className={`px-2 py-1.5 rounded-r-xl text-xs font-semibold transition-all border border-l-slate-200/50 ${
                              isSelected
                                ? 'bg-indigo-700 border-indigo-600 text-white hover:bg-indigo-800'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Visual preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Link Visual Appearance</span>
                  <span className="text-slate-400 text-[11px]">All '{selectedTagInput.trim() || 'tag'}' links will share this style</span>
                </div>

                <div className="h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center px-6">
                  <svg className="w-full h-8" viewBox="0 0 240 32">
                    <line 
                      x1="20" y1="16" x2="215" y2="16" 
                      stroke={newTagColor} 
                      strokeWidth="2" 
                      strokeDasharray={
                        newTagLineStyle === 'dashed' ? '6,4' :
                        newTagLineStyle === 'dotted' ? '2,3' :
                        newTagLineStyle === 'dash-dot' ? '8,3,2,3' : undefined
                      }
                    />
                    <polygon points="215,12 225,16 215,20" fill={newTagColor} />
                    {newTagShowLabel && (
                      <g transform="translate(120, 16)">
                        <rect 
                          x={-(Math.max(50, (selectedTagInput || 'tag').length * 7 + 16)) / 2} 
                          y="-10" 
                          width={Math.max(50, (selectedTagInput || 'tag').length * 7 + 16)} 
                          height="20" 
                          rx="5" 
                          fill="white" 
                          stroke={newTagColor} 
                          strokeWidth="1.5" 
                        />
                        <text 
                          x="0" 
                          y="3.5" 
                          fill={newTagColor} 
                          fontSize="10" 
                          fontWeight="bold" 
                          fontStyle="italic" 
                          textAnchor="middle"
                        >
                          {selectedTagInput || 'tag'}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Color swatches */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Color</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { name: 'Blue', hex: '#2563eb' },
                      { name: 'Indigo', hex: '#4f46e5' },
                      { name: 'Cyan', hex: '#0891b2' },
                      { name: 'Emerald', hex: '#059669' },
                      { name: 'Amber', hex: '#d97706' },
                      { name: 'Rose', hex: '#e11d48' },
                      { name: 'Purple', hex: '#9333ea' },
                      { name: 'Slate', hex: '#475569' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewTagColor(c.hex)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          newTagColor.toLowerCase() === c.hex.toLowerCase() 
                            ? 'border-slate-800 scale-110 shadow-xs' 
                            : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-6 h-6 p-0 border border-slate-200 rounded cursor-pointer bg-transparent"
                      title="Custom Color"
                    />
                  </div>
                </div>

                {/* Line Style */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Line Pattern</span>
                  <div className="grid grid-cols-4 gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                    {(['solid', 'dashed', 'dotted', 'dash-dot'] as TagLineStyle[]).map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setNewTagLineStyle(style)}
                        className={`py-1.5 rounded-lg text-center capitalize transition-all ${
                          newTagLineStyle === style 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {style === 'dash-dot' ? 'Dash-Dot' : style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show Label Checkbox */}
                <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-semibold text-slate-700">Display tag badge on link in diagram</span>
                  <input
                    type="checkbox"
                    checked={newTagShowLabel}
                    onChange={(e) => setNewTagShowLabel(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                type="button"
                onClick={() => setTaggedLinkDialog(null)}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmTaggedLink(selectedTagInput, newTagColor, newTagLineStyle, newTagShowLabel)}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
              >
                Create Tagged Link
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{dialog.title}</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed">{dialog.message}</p>
            </div>
            <div className="p-6 bg-slate-50/50 flex flex-col gap-2">
              <button 
                onClick={dialog.onConfirm}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
              {dialog.showSecondary && (
                <button 
                  onClick={dialog.onSecondary}
                  className="w-full py-3 px-4 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-bold rounded-xl transition-all"
                >
                  {dialog.secondaryLabel || 'Secondary Action'}
                </button>
              )}
              <button 
                onClick={() => {
                  if (dialog.onCancel) dialog.onCancel();
                  setDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="w-full py-3 px-4 bg-transparent hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-all"
              >
                {dialog.cancelLabel || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Rename Tag Across Model Dialog */}
      {renameTagModal && renameTagModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2500] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Rename Tag for All Relations</h2>
                  <p className="text-xs text-slate-500">
                    Update all relations tagged <span className="font-semibold text-indigo-600">'{renameTagModal.oldTag}'</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setRenameTagModal(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const relationsWithTag = model.logical.links.filter(
                  l => l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim().toLowerCase() === renameTagModal.oldTag.trim().toLowerCase()
                );
                const count = relationsWithTag.length;

                return (
                  <>
                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        Affects {count} structural relation{count === 1 ? '' : 's'} in the model:
                      </div>
                      {count > 0 ? (
                        <div className="max-h-24 overflow-y-auto space-y-1 pt-1">
                          {relationsWithTag.map((l, idx) => {
                            const src = model.logical.elements.find(e => e.id === l.sourceId)?.name || 'Source';
                            const tgt = model.logical.elements.find(e => e.id === l.targetId)?.name || 'Target';
                            return (
                              <div key={l.id || idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                                <span className="font-medium text-slate-900">{src}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-900">{tgt}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">No active links currently use this tag, but the tag definition will be renamed.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">New Tag Name</label>
                      <input 
                        type="text"
                        value={renameInputVal}
                        onChange={(e) => setRenameInputVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && renameInputVal.trim() && renameInputVal.trim().toLowerCase() !== renameTagModal.oldTag.trim().toLowerCase()) {
                            renameTagGlobally(renameTagModal.oldTag, renameInputVal.trim());
                          }
                        }}
                        autoFocus
                        placeholder="e.g. enables, contains, manages"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => setRenameTagModal(null)}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (renameInputVal.trim()) {
                    renameTagGlobally(renameTagModal.oldTag, renameInputVal.trim());
                  }
                }}
                disabled={!renameInputVal.trim() || renameInputVal.trim().toLowerCase() === renameTagModal.oldTag.trim().toLowerCase()}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none text-sm"
              >
                Rename All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {isManageTagsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2400] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Manage Structural Tags</h2>
                  <p className="text-xs text-slate-500">
                    Rename or manage custom relation tags across your model
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsManageTagsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {(() => {
                // Collect unique tags from logical.tags and any links with tags
                const tagNamesSet = new Set<string>();
                (model.logical.tags || []).forEach(t => tagNamesSet.add(t.name));
                model.logical.links.forEach(l => {
                  if (l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim()) {
                    tagNamesSet.add(l.tag.trim());
                  }
                });

                const allUniqueTags = Array.from(tagNamesSet);

                if (allUniqueTags.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400">
                      <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No custom tags created yet</p>
                      <p className="text-xs text-slate-400 mt-1">Create a Tagged Structural Link between elements to define tags.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {allUniqueTags.map(tagName => {
                      const count = model.logical.links.filter(
                        l => l.type === LinkType.TAGGED_STRUCTURAL && l.tag?.trim().toLowerCase() === tagName.toLowerCase()
                      ).length;
                      const style = currentOpd.visual.tagStyles?.find(ts => ts.tag.toLowerCase() === tagName.toLowerCase());
                      const color = style?.color || '#2563eb';

                      return (
                        <div 
                          key={tagName} 
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span 
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                              style={{ backgroundColor: color }} 
                            />
                            <div>
                              <div className="text-sm font-bold text-slate-900">{tagName}</div>
                              <div className="text-xs text-slate-500">
                                {count} relation{count === 1 ? '' : 's'} using this tag
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRenameInputVal(tagName);
                                setRenameTagModal({ isOpen: true, oldTag: tagName });
                              }}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title={`Rename tag '${tagName}' across all relations`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteTagGlobally(tagName);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={`Delete tag '${tagName}'`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsManageTagsOpen(false)}
                className="py-2 px-5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information Model Prompt Modal */}
      {infoModelPrompt && infoModelPrompt.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2600] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Information Model Detected</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      No Diagrams Included
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {infoModelPrompt.fileName ? `File: ${infoModelPrompt.fileName} • ` : ''}Generating visual representation from ontology
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInfoModelPrompt(null)}
                className="p-2 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer"
                title="Cancel Import"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2">
                <div className="font-semibold text-indigo-900 flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Automatic OPM Diagram & OPL Synthesis
                </div>
                <p>
                  This file contains an information model defining system ontology (elements and relations) without visual diagram representations. 
                  The application will automatically synthesize <strong>{infoModelPrompt.hierarchy.plannedDiagrams.length} diagram{infoModelPrompt.hierarchy.plannedDiagrams.length === 1 ? '' : 's'}</strong> based on the model's structural hierarchy and depth, allowing you to explore the system both diagrammatically (OPDs) and textually (OPLs).
                </p>
              </div>

              {/* Model Metrics Overview */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Model Information & Depth</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">Elements</div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{infoModelPrompt.hierarchy.totalElements}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {infoModelPrompt.hierarchy.objectCount} obj • {infoModelPrompt.hierarchy.processCount} proc • {infoModelPrompt.hierarchy.stateCount} states
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">Relations</div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{infoModelPrompt.hierarchy.linkCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Procedural & structural links
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">Hierarchy Depth</div>
                    <div className="text-xl font-bold text-indigo-600 mt-0.5">
                      {infoModelPrompt.hierarchy.maxDepth === 0 ? 'Depth 0' : `Depth ${infoModelPrompt.hierarchy.maxDepth}`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {infoModelPrompt.hierarchy.decomposedProcesses.length === 0 
                        ? 'Single-level (SD)' 
                        : `${infoModelPrompt.hierarchy.decomposedProcesses.length} in-zoomed process${infoModelPrompt.hierarchy.decomposedProcesses.length === 1 ? '' : 'es'}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Planned Diagrams to Synthesize */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Diagrams to be Generated ({infoModelPrompt.hierarchy.plannedDiagrams.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {infoModelPrompt.hierarchy.plannedDiagrams.map((diag, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {idx === 0 ? 'SD' : `SD${idx}`}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{diag.name}</div>
                          <div className="text-[11px] text-slate-500">{diag.level}</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {diag.elementCount} elements
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setInfoModelPrompt(null)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmGenerateDiagrams}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 text-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Diagrams & Open Model
              </button>
            </div>
          </div>
        </div>
      )}

      {isTutorialActive && (
        <TutorialOverlay
          currentStep={currentTutorialStep}
          totalSteps={TUTORIAL_STEPS.length}
          isOpen={isTutorialActive}
          onNext={handleNextTutorialStep}
          onPrev={handlePrevTutorialStep}
          onSkip={handleSkipTutorial}
          onFinish={handleFinishTutorial}
          targetId={TUTORIAL_STEPS[currentTutorialStep].targetId}
          stepTitle={TUTORIAL_STEPS[currentTutorialStep].title}
          stepDescription={TUTORIAL_STEPS[currentTutorialStep].description}
          stepLongDescription={TUTORIAL_STEPS[currentTutorialStep].longDescription}
        />
      )}
    </div>
  );
}

function ToolButton({ id, active, onClick, icon, label }: { id?: string, active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-2xl transition-all group relative",
        active 
          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110" 
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
      title={label}
    >
      {icon}
      {!active && (
        <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-4px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
          {label}
        </span>
      )}
    </button>
  );
}
