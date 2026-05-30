import { OPMModel, ElementType, Essence, Affiliation, LinkType } from '../types';

export interface TutorialStep {
  title: string;
  description: string;
  longDescription: string;
  targetId?: string;
  modelState: OPMModel;
  selectedId: string | null;
  selectedLinkId: string | null;
  activeTool: 'select' | 'procedural' | ElementType | LinkType;
}

const BASE_OPD_ID = 'espresso-sd';

const createBaseOpd = (elements: any[], links: any[]) => ({
  id: BASE_OPD_ID,
  name: 'SD',
  visual: {
    elements,
    links
  }
});

export const TUTORIAL_STEPS: TutorialStep[] = [
  // Step 0: Loading Intro Page (model empty or fallback)
  {
    title: 'Welcome to the OPM-Pro Walkthrough',
    description: '',
    longDescription: '',
    selectedId: null,
    selectedLinkId: null,
    activeTool: 'select',
    modelState: {
      logical: { elements: [], links: [] },
      opds: [createBaseOpd([], [])],
      currentOpdId: BASE_OPD_ID
    }
  },
  
  // Step 1: Add Espresso Maker (Object)
  {
    title: 'Create the system root class',
    description: 'First, select the "Object" tool on the toolbar',
    longDescription: 'Object-Process Methodology starts with describing things that exist. We will model our main hardware system: the "Espresso Maker". Notice how objects are structured as high-contrast rectangles inside OPM.',
    targetId: 'tool-btn-OBJECT',
    selectedId: 'espresso-maker',
    selectedLinkId: null,
    activeTool: ElementType.OBJECT,
    modelState: {
      logical: {
        elements: [
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC }
        ],
        links: []
      },
      opds: [
        createBaseOpd([
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 }
        ], [])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 2: Add Water Tank & Grinder (Aggregation)
  {
    title: 'Model sub-components (Structural Aggregation)',
    description: 'We represent structural components using the "Aggregation" tool (solid triangle)',
    longDescription: 'Complex systems are composed of parts. OPM models this using an Aggregation-Part-of relation (a solid triangle arrow). We connect "Espresso Maker" to its vital structural parts: "Water Tank" and "Grinder". Notice how physical components are modeled vertically descending.',
    targetId: 'tool-btn-AGGREGATION',
    selectedId: null,
    selectedLinkId: null,
    activeTool: LinkType.AGGREGATION,
    modelState: {
      logical: {
        elements: [
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 3: Configure behavioral states of Water Tank
  {
    title: 'Inject physical properties (States)',
    description: 'Add individual states via the Properties Sidebar',
    longDescription: 'In OPM, objects can change! We can define states inside elements. Let\'s select the "Water Tank" to open the Properties sidebar on the right, and add two states: "empty" and "full". We make "empty" the pre-selected Initial state.',
    targetId: 'properties-sidebar',
    selectedId: 'water-tank',
    selectedLinkId: null,
    activeTool: 'select',
    modelState: {
      logical: {
        elements: [
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 4: System Taxonomy (Generalization)
  {
    title: 'Model taxonomy hierarchy (Generalization - G)',
    description: 'Connect classes using Generalization tool (empty triangle)',
    longDescription: 'OPM represents lineage/sub-classes with a standard hollow-triangle Generalization link. Let\'s place "Kitchen Appliance" to represent the structural taxonomy class, and draw a G link from "Kitchen Appliance" to "Espresso Maker" meaning "Espresso Maker is a subclass of Kitchen Appliance".',
    targetId: 'tool-btn-GENERALIZATION',
    selectedId: null,
    selectedLinkId: null,
    activeTool: LinkType.GENERALIZATION,
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 5: System Features (Exhibition)
  {
    title: 'Showcase system attributes (Exhibition - E)',
    description: 'We connect exhibits or attributes using the Exhibition tool',
    longDescription: 'In OPM, physical objects or informatic entities can exhibit values or secondary properties. Let\'s place the object "Water Temperature" to specify heat features, and connect Espresso Maker to "Water Temperature" using Exhibition (solid circle inside empty triangle).',
    targetId: 'tool-btn-EXHIBITION',
    selectedId: null,
    selectedLinkId: null,
    activeTool: LinkType.EXHIBITION,
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 6: Concrete Items (Instantiation)
  {
    title: 'Support concrete realization (Instantiation - I)',
    description: 'Convert templates to live units using the Instantiation tool',
    longDescription: 'Lastly for structural modeling, we can define real-world physical devices representing a class template using Instantiation (solid circle in solid triangle). We connect Espresso Maker class to "My Office Espresso Maker" using an Instantiation (I) link.',
    targetId: 'tool-btn-INSTANTIATION',
    selectedId: null,
    selectedLinkId: null,
    activeTool: LinkType.INSTANTIATION,
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 7: Create dynamic processes (Behavioral processes)
  {
    title: 'Model Dynamic System Behavior (Processes)',
    description: 'Now, select the "Process" tool in the left toolbar (hollow ellipse)',
    longDescription: 'A static system is only half the story! OPM represents behavior and processes using Ellipses. Let\'s place two primary operations of our maker below: the process "Water Heating" (which operates on water) and the process "Espresso Brewing" (which creates the delicious coffee!).',
    targetId: 'tool-btn-PROCESS',
    selectedId: null,
    selectedLinkId: null,
    activeTool: ElementType.PROCESS,
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 8: Interactive instrument link condition
  {
    title: 'Add procedural conditions (Instrument Link)',
    description: 'Select the "Instrument" link tool on the toolbar (empty circle arrow)',
    longDescription: 'In OPM, processes interact with objects. We will configure standard procedural requirements. Using the Instrument link tool, click the "full" state inside Water Tank, and connect it to process "Water Heating". This states that Water Heating requires the Water Tank to be Full! We also place the ultimate outcome object representing result/effect: "Espresso Cup".',
    targetId: 'tool-btn-INSTRUMENT',
    selectedId: null,
    selectedLinkId: null,
    activeTool: LinkType.INSTRUMENT,
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-obj', type: ElementType.OBJECT, name: 'Espresso Cup', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isInitial: true },
          { id: 'cup-filled', type: ElementType.STATE, name: 'filled', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isFinal: true }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' },
          { id: 'l_wt_heat_inst', type: LinkType.INSTRUMENT, sourceId: 'wt-full', targetId: 'heating' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 },
          { id: 'cup-obj', x: 500, y: 520, width: 140, height: 80 },
          { id: 'cup-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'cup-obj' },
          { id: 'cup-filled', x: 78, y: 35, width: 50, height: 35, parentId: 'cup-obj' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' },
          { id: 'l_wt_heat_inst' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 9: Process Invocation & Output Generation
  {
    title: 'Connect dynamic triggering (Invocation & Results)',
    description: 'Select the "Invoke" link tool (Zap symbol) on the left sidebar',
    longDescription: 'Now we map temporal process calling. Using the "Invoke" tool, click "Water Heating" and drag to "Espresso Brewing". This specifies that completing water heating automatically launches coffee brewing. We also map the successful outcome: Espresso Brewing produces a "filled" Espresso Cup via a Result link.',
    targetId: 'tool-btn-INVOCATION',
    selectedId: null,
    selectedLinkId: null,
    activeTool: LinkType.INVOCATION,
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-obj', type: ElementType.OBJECT, name: 'Espresso Cup', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isInitial: true },
          { id: 'cup-filled', type: ElementType.STATE, name: 'filled', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isFinal: true }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' },
          { id: 'l_wt_heat_inst', type: LinkType.INSTRUMENT, sourceId: 'wt-full', targetId: 'heating' },
          { id: 'l_heat_brew_inv', type: LinkType.INVOCATION, sourceId: 'heating', targetId: 'brewing' },
          { id: 'l_brew_cup_res', type: LinkType.RESULT, sourceId: 'brewing', targetId: 'cup-filled' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 },
          { id: 'cup-obj', x: 500, y: 520, width: 140, height: 80 },
          { id: 'cup-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'cup-obj' },
          { id: 'cup-filled', x: 78, y: 35, width: 50, height: 35, parentId: 'cup-obj' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' },
          { id: 'l_wt_heat_inst' },
          { id: 'l_heat_brew_inv' },
          { id: 'l_brew_cup_res' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 10: Human Readable OPL panel validation
  {
    title: 'Dynamic English Specification generation (OPL)',
    description: 'Look at the Object-Process Language (OPL) pane on the right',
    longDescription: 'Witness the core magic of OPM! In real time as your diagrams grow, OPM-Pro auto-synthesizes human-readable syntax in the right hand column, documenting complex behavioral linkages (e.g. "Espresso brewing requires Water Tank in state full", "My Office Espresso Maker is an instance of Espresso Maker"). Stakeholders and designers can immediately read, verify, and export this zero-mistake roadmap.',
    targetId: 'opl-panel',
    selectedId: null,
    selectedLinkId: null,
    activeTool: 'select',
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-obj', type: ElementType.OBJECT, name: 'Espresso Cup', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isInitial: true },
          { id: 'cup-filled', type: ElementType.STATE, name: 'filled', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isFinal: true }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' },
          { id: 'l_wt_heat_inst', type: LinkType.INSTRUMENT, sourceId: 'wt-full', targetId: 'heating' },
          { id: 'l_heat_brew_inv', type: LinkType.INVOCATION, sourceId: 'heating', targetId: 'brewing' },
          { id: 'l_brew_cup_res', type: LinkType.RESULT, sourceId: 'brewing', targetId: 'cup-filled' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 },
          { id: 'cup-obj', x: 500, y: 520, width: 140, height: 80 },
          { id: 'cup-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'cup-obj' },
          { id: 'cup-filled', x: 78, y: 35, width: 50, height: 35, parentId: 'cup-obj' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' },
          { id: 'l_wt_heat_inst' },
          { id: 'l_heat_brew_inv' },
          { id: 'l_brew_cup_res' }
        ])
      ],
      currentOpdId: BASE_OPD_ID
    }
  },

  // Step 11: Zoom Into Process Elaboration
  {
    title: 'Zoom-In Process Elaboration',
    description: 'Double-click a process to explore its lower-level steps',
    longDescription: 'To model complex systems elegantly, OPM uses "In-Zooming" to show lower-level process refinement on a nested child diagram (OPD). We have zoomed into "Water Heating". Inside the expanded "Water Heating" boundary, we can define sub-processes of "Water Heating" such as: "Water Sensing" and "Element Powering".',
    targetId: 'tool-btn-PROCESS',
    selectedId: null,
    selectedLinkId: null,
    activeTool: 'select',
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-obj', type: ElementType.OBJECT, name: 'Espresso Cup', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isInitial: true },
          { id: 'cup-filled', type: ElementType.STATE, name: 'filled', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isFinal: true },
          // New nested sub-processes under "heating"
          { id: 'water-sensing', type: ElementType.PROCESS, name: 'Water Sensing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'heating' },
          { id: 'ele-powering', type: ElementType.PROCESS, name: 'Element Powering', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'heating' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' },
          { id: 'l_wt_heat_inst', type: LinkType.INSTRUMENT, sourceId: 'wt-full', targetId: 'heating' },
          { id: 'l_heat_brew_inv', type: LinkType.INVOCATION, sourceId: 'heating', targetId: 'brewing' },
          { id: 'l_brew_cup_res', type: LinkType.RESULT, sourceId: 'brewing', targetId: 'cup-filled' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 },
          { id: 'cup-obj', x: 500, y: 520, width: 140, height: 80 },
          { id: 'cup-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'cup-obj' },
          { id: 'cup-filled', x: 78, y: 35, width: 50, height: 35, parentId: 'cup-obj' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' },
          { id: 'l_wt_heat_inst' },
          { id: 'l_heat_brew_inv' },
          { id: 'l_brew_cup_res' }
        ]),
        {
          id: 'heating-zoom',
          name: 'Water Heating in-zoomed',
          parentProcessId: 'heating',
          visual: {
            elements: [
              { id: 'heating', x: 50, y: 50, width: 500, height: 320 },
              { id: 'water-sensing', x: 180, y: 110, width: 180, height: 65, parentId: 'heating' },
              { id: 'ele-powering', x: 180, y: 230, width: 180, height: 65, parentId: 'heating' }
            ],
            links: []
          }
        }
      ],
      currentOpdId: 'heating-zoom'
    }
  },

  // Step 12: View the Zoomed-In Process in OPL
  {
    title: 'OPL Zoom-In & Control Flow Reflection',
    description: 'Notice the resulting human-readable sentences generated automatically',
    longDescription: 'OPM-Pro translates nested processes immediately into clear, standard structured rules. In the OPL column, you will now see: "Water Heating zooms into Water Sensing and Element Powering." Because Water Sensing is positioned vertically above Element Powering, it defines strict implicit action scheduling: "Water Sensing invokes Element Powering."',
    targetId: 'opl-panel',
    selectedId: null,
    selectedLinkId: null,
    activeTool: 'select',
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-obj', type: ElementType.OBJECT, name: 'Espresso Cup', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isInitial: true },
          { id: 'cup-filled', type: ElementType.STATE, name: 'filled', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isFinal: true },
          // New nested sub-processes under "heating"
          { id: 'water-sensing', type: ElementType.PROCESS, name: 'Water Sensing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'heating' },
          { id: 'ele-powering', type: ElementType.PROCESS, name: 'Element Powering', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'heating' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' },
          { id: 'l_wt_heat_inst', type: LinkType.INSTRUMENT, sourceId: 'wt-full', targetId: 'heating' },
          { id: 'l_heat_brew_inv', type: LinkType.INVOCATION, sourceId: 'heating', targetId: 'brewing' },
          { id: 'l_brew_cup_res', type: LinkType.RESULT, sourceId: 'brewing', targetId: 'cup-filled' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 },
          { id: 'cup-obj', x: 500, y: 520, width: 140, height: 80 },
          { id: 'cup-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'cup-obj' },
          { id: 'cup-filled', x: 78, y: 35, width: 50, height: 35, parentId: 'cup-obj' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' },
          { id: 'l_wt_heat_inst' },
          { id: 'l_heat_brew_inv' },
          { id: 'l_brew_cup_res' }
        ]),
        {
          id: 'heating-zoom',
          name: 'Water Heating in-zoomed',
          parentProcessId: 'heating',
          visual: {
            elements: [
              { id: 'heating', x: 50, y: 50, width: 500, height: 320 },
              { id: 'water-sensing', x: 180, y: 110, width: 180, height: 65, parentId: 'heating' },
              { id: 'ele-powering', x: 180, y: 230, width: 180, height: 65, parentId: 'heating' }
            ],
            links: []
          }
        }
      ],
      currentOpdId: 'heating-zoom'
    }
  },

  // Step 13: Go back to original SD and show full model OPL update
  {
    title: 'Integrated Multi-Diagram OPL Alignment',
    description: 'See the complete system language compiled cohesively',
    longDescription: 'We are now back on the high-level System Diagram (SD). In the OPL panel, change the view mode from "Diagram" to "Full Model". Observe how the tool compiles all diagram levels together automatically. It preserves the high-level OPM relationships of the main system diagram, while seamlessly integrating the low-level elaborated details and sub-processes of "Water Heating" in a single unified text document.',
    targetId: 'opl-panel',
    selectedId: null,
    selectedLinkId: null,
    activeTool: 'select',
    modelState: {
      logical: {
        elements: [
          { id: 'appl', type: ElementType.OBJECT, name: 'Kitchen Appliance', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'espresso-maker', type: ElementType.OBJECT, name: 'Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'temp', type: ElementType.OBJECT, name: 'Water Temperature', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-appl', type: ElementType.OBJECT, name: 'My Office Espresso Maker', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'water-tank', type: ElementType.OBJECT, name: 'Water Tank', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'grinder', type: ElementType.OBJECT, name: 'Grinder', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wt-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank', isInitial: true },
          { id: 'wt-full', type: ElementType.STATE, name: 'full', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'water-tank' },
          { id: 'heating', type: ElementType.PROCESS, name: 'Water Heating', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'brewing', type: ElementType.PROCESS, name: 'Espresso Brewing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-obj', type: ElementType.OBJECT, name: 'Espresso Cup', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'cup-empty', type: ElementType.STATE, name: 'empty', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isInitial: true },
          { id: 'cup-filled', type: ElementType.STATE, name: 'filled', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC, parentId: 'cup-obj', isFinal: true },
          // New nested sub-processes under "heating"
          { id: 'water-sensing', type: ElementType.PROCESS, name: 'Water Sensing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'heating' },
          { id: 'ele-powering', type: ElementType.PROCESS, name: 'Element Powering', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'heating' }
        ],
        links: [
          { id: 'l_wt_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'water-tank' },
          { id: 'l_gr_agg', type: LinkType.AGGREGATION, sourceId: 'espresso-maker', targetId: 'grinder' },
          { id: 'l_app_gen', type: LinkType.GENERALIZATION, sourceId: 'appl', targetId: 'espresso-maker' },
          { id: 'l_temp_exh', type: LinkType.EXHIBITION, sourceId: 'espresso-maker', targetId: 'temp' },
          { id: 'l_my_inst', type: LinkType.INSTANTIATION, sourceId: 'espresso-maker', targetId: 'my-appl' },
          { id: 'l_wt_heat_inst', type: LinkType.INSTRUMENT, sourceId: 'wt-full', targetId: 'heating' },
          { id: 'l_heat_brew_inv', type: LinkType.INVOCATION, sourceId: 'heating', targetId: 'brewing' },
          { id: 'l_brew_cup_res', type: LinkType.RESULT, sourceId: 'brewing', targetId: 'cup-filled' }
        ]
      },
      opds: [
        createBaseOpd([
          { id: 'appl', x: 350, y: 10, width: 140, height: 50 },
          { id: 'espresso-maker', x: 340, y: 110, width: 160, height: 75 },
          { id: 'temp', x: 100, y: 121, width: 130, height: 53 },
          { id: 'my-appl', x: 580, y: 120, width: 175, height: 55 },
          { id: 'water-tank', x: 180, y: 260, width: 140, height: 80 },
          { id: 'grinder', x: 500, y: 260, width: 140, height: 80 },
          { id: 'wt-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'wt-full', x: 78, y: 35, width: 50, height: 35, parentId: 'water-tank' },
          { id: 'heating', x: 180, y: 400, width: 140, height: 65 },
          { id: 'brewing', x: 500, y: 400, width: 140, height: 65 },
          { id: 'cup-obj', x: 500, y: 520, width: 140, height: 80 },
          { id: 'cup-empty', x: 12, y: 35, width: 50, height: 35, parentId: 'cup-obj' },
          { id: 'cup-filled', x: 78, y: 35, width: 50, height: 35, parentId: 'cup-obj' }
        ], [
          { id: 'l_wt_agg' },
          { id: 'l_gr_agg' },
          { id: 'l_app_gen' },
          { id: 'l_temp_exh' },
          { id: 'l_my_inst' },
          { id: 'l_wt_heat_inst' },
          { id: 'l_heat_brew_inv' },
          { id: 'l_brew_cup_res' }
        ]),
        {
          id: 'heating-zoom',
          name: 'Water Heating in-zoomed',
          parentProcessId: 'heating',
          visual: {
            elements: [
              { id: 'heating', x: 50, y: 50, width: 500, height: 320 },
              { id: 'water-sensing', x: 180, y: 110, width: 180, height: 65, parentId: 'heating' },
              { id: 'ele-powering', x: 180, y: 230, width: 180, height: 65, parentId: 'heating' }
            ],
            links: []
          }
        }
      ],
      currentOpdId: BASE_OPD_ID
    }
  }
];
