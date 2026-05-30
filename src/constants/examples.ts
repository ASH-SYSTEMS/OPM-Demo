import { OPMModel, ElementType, LinkType, Essence, Affiliation } from '../types';

export interface OPMExample {
  id: string;
  name: string;
  description: string;
  model: OPMModel;
}

export const OPM_EXAMPLES: OPMExample[] = [
  {
    id: 'atm-withdrawal',
    name: 'ATM Withdrawal',
    description: 'A classic OPM model of an ATM withdrawal process.',
    model: {
      logical: {
        elements: [
          { id: '1', type: ElementType.OBJECT, name: 'ATM', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: '2', type: ElementType.OBJECT, name: 'Card', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: '3', type: ElementType.PROCESS, name: 'Withdrawing Cash', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: '4', type: ElementType.OBJECT, name: 'Cash', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: '2-1', type: ElementType.STATE, name: 'Inserted', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: '2' },
          { id: '2-2', type: ElementType.STATE, name: 'Ejected', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: '2', isDefault: true },
        ],
        links: [
          { id: 'l1', type: LinkType.INSTRUMENT, sourceId: '1', targetId: '3' },
          { id: 'l2', type: LinkType.CONSUMPTION, sourceId: '2-2', targetId: '3' },
          { id: 'l3', type: LinkType.RESULT, sourceId: '3', targetId: '2-1' },
          { id: 'l4', type: LinkType.RESULT, sourceId: '3', targetId: '4' },
        ]
      },
      opds: [{
        id: 'atm-sd',
        name: 'SD',
        visual: {
          elements: [
            { id: '1', x: 50, y: 50, width: 120, height: 60 },
            { id: '2', x: 50, y: 200, width: 120, height: 100 },
            { id: '3', x: 300, y: 125, width: 140, height: 70 },
            { id: '4', x: 550, y: 125, width: 120, height: 60 },
            { id: '2-1', x: 10, y: 10, width: 100, height: 35 },
            { id: '2-2', x: 10, y: 55, width: 100, height: 35 },
          ],
          links: [
            { id: 'l1' },
            { id: 'l2' },
            { id: 'l3' },
            { id: 'l4' },
          ]
        }
      }],
      currentOpdId: 'atm-sd'
    }
  },
  {
    id: 'multi-level-process',
    name: 'Multi-level System',
    description: 'A complex system with three levels of process decomposition.',
    model: {
      logical: {
        elements: [
          { id: 'sys', type: ElementType.PROCESS, name: 'System Operation', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'p1', type: ElementType.PROCESS, name: 'Data Acquisition', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'sys' },
          { id: 'p2', type: ElementType.PROCESS, name: 'Data Processing', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'sys' },
          { id: 'p2.1', type: ElementType.PROCESS, name: 'Validation', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p2' },
          { id: 'p2.2', type: ElementType.PROCESS, name: 'Transformation', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p2' },
          { id: 'p3', type: ElementType.PROCESS, name: 'Output Generation', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'sys' },
          { id: 'raw', type: ElementType.OBJECT, name: 'Raw Data', essence: Essence.PHYSICAL, affiliation: Affiliation.ENVIRONMENTAL },
          { id: 'res', type: ElementType.OBJECT, name: 'Result', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
        ],
        links: [
          // At SD level:
          { id: 'l1_sd', type: LinkType.CONSUMPTION, sourceId: 'raw', targetId: 'sys' },
          { id: 'l2_sd', type: LinkType.RESULT, sourceId: 'sys', targetId: 'res' },
          // At sys-in level:
          { id: 'l1', type: LinkType.CONSUMPTION, sourceId: 'raw', targetId: 'p1' },
          { id: 'l2', type: LinkType.RESULT, sourceId: 'p3', targetId: 'res' },
          { id: 'l3', type: LinkType.INVOCATION, sourceId: 'p1', targetId: 'p2' },
          { id: 'l4', type: LinkType.INVOCATION, sourceId: 'p2', targetId: 'p3' },
          // At p2-in level:
          { id: 'l5', type: LinkType.INVOCATION, sourceId: 'p2.1', targetId: 'p2.2' },
        ]
      },
      opds: [
        {
          id: 'sd',
          name: 'SD',
          visual: {
            elements: [
              { id: 'sys', x: 250, y: 120, width: 220, height: 110 },
              { id: 'raw', x: 60, y: 150, width: 110, height: 50 },
              { id: 'res', x: 550, y: 150, width: 110, height: 50 },
            ],
            links: [
              { id: 'l1_sd' },
              { id: 'l2_sd' },
            ]
          }
        },
        {
          id: 'sys-in',
          name: 'System Operation in-zoomed',
          parentProcessId: 'sys',
          visual: {
            elements: [
              { id: 'sys', x: 180, y: 80, width: 500, height: 260 },
              { id: 'raw', x: 30, y: 185, width: 100, height: 50 },
              { id: 'res', x: 720, y: 185, width: 100, height: 50 },
              { id: 'p1', x: 40, y: 100, width: 110, height: 55 },
              { id: 'p2', x: 190, y: 100, width: 110, height: 55 },
              { id: 'p3', x: 340, y: 100, width: 110, height: 55 },
            ],
            links: [
              { id: 'l1' },
              { id: 'l3' },
              { id: 'l4' },
              { id: 'l2' },
            ]
          }
        },
        {
          id: 'p2-in',
          name: 'Data Processing in-zoomed',
          parentProcessId: 'p2',
          visual: {
            elements: [
              { id: 'p2', x: 180, y: 80, width: 500, height: 260 },
              { id: 'p2.1', x: 80, y: 100, width: 110, height: 55 },
              { id: 'p2.2', x: 270, y: 100, width: 110, height: 55 },
            ],
            links: [
              { id: 'l5' },
            ]
          }
        }
      ],
      currentOpdId: 'sd'
    }
  },
  {
    id: 'opm-pro-modeling',
    name: 'OPM-Pro Modeling System',
    description: 'A deep reflective OPM model of a user designing, validating, and generating OPL on OPM-Pro.',
    model: {
      logical: {
        elements: [
          { id: 'user', type: ElementType.OBJECT, name: 'User (Modeler)', essence: Essence.PHYSICAL, affiliation: Affiliation.ENVIRONMENTAL },
          { id: 'tool', type: ElementType.OBJECT, name: 'OPM-Pro Tool', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'model_obj', type: ElementType.OBJECT, name: 'OPM Model', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 's_draft', type: ElementType.STATE, name: 'Draft', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'model_obj', isDefault: true },
          { id: 's_valid', type: ElementType.STATE, name: 'Validated', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'model_obj' },
          { id: 's_export', type: ElementType.STATE, name: 'Exported', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'model_obj' },
          { id: 'opl_doc', type: ElementType.OBJECT, name: 'OPL Document', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          
          // High Level Processes
          { id: 'p_mod', type: ElementType.PROCESS, name: 'Modeling System', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'p_val', type: ElementType.PROCESS, name: 'Validating Model', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'p_gen_opl', type: ElementType.PROCESS, name: 'Generating OPL', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'p_exp', type: ElementType.PROCESS, name: 'Exporting Model', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },

          // Lower Level Nested Subprocesses inside Modeling System
          { id: 'p_mod_create', type: ElementType.PROCESS, name: 'Creating Elements', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_mod' },
          { id: 'p_mod_link', type: ElementType.PROCESS, name: 'Connecting Links', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_mod' },

          // Lower Level Nested Subprocesses inside Validating Model
          { id: 'p_val_scan', type: ElementType.PROCESS, name: 'Scanning Schema Constraints', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_val' },
          { id: 'p_val_flag', type: ElementType.PROCESS, name: 'Highlighting Issues', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_val' },

          // Lower Level Nested Subprocesses inside Generating OPL
          { id: 'p_gen_parse', type: ElementType.PROCESS, name: 'Parsing Structure', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_gen_opl' },
          { id: 'p_gen_render', type: ElementType.PROCESS, name: 'Synthesizing English Sentences', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_gen_opl' },

          // Lower Level Nested Subprocesses inside Exporting Model
          { id: 'p_exp_serialize', type: ElementType.PROCESS, name: 'Serializing JSON', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_exp' },
          { id: 'p_exp_trigger', type: ElementType.PROCESS, name: 'Triggering Download', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC, parentId: 'p_exp' },
        ],
        links: [
          // High level relationships at SD:
          { id: 'l_user_mod', type: LinkType.AGENT, sourceId: 'user', targetId: 'p_mod' },
          { id: 'l_tool_mod', type: LinkType.INSTRUMENT, sourceId: 'tool', targetId: 'p_mod' },
          { id: 'l_tool_val', type: LinkType.INSTRUMENT, sourceId: 'tool', targetId: 'p_val' },
          { id: 'l_tool_opl', type: LinkType.INSTRUMENT, sourceId: 'tool', targetId: 'p_gen_opl' },
          { id: 'l_tool_exp', type: LinkType.INSTRUMENT, sourceId: 'tool', targetId: 'p_exp' },
          { id: 'l_mod_draft', type: LinkType.RESULT, sourceId: 'p_mod', targetId: 's_draft' },
          { id: 'l_val_consume', type: LinkType.CONSUMPTION, sourceId: 's_draft', targetId: 'p_val' },
          { id: 'l_val_result', type: LinkType.RESULT, sourceId: 'p_val', targetId: 's_valid' },
          { id: 'l_opl_consume', type: LinkType.CONSUMPTION, sourceId: 's_valid', targetId: 'p_gen_opl' },
          { id: 'l_opl_result', type: LinkType.RESULT, sourceId: 'p_gen_opl', targetId: 'opl_doc' },
          { id: 'l_exp_consume', type: LinkType.CONSUMPTION, sourceId: 's_valid', targetId: 'p_exp' },
          { id: 'l_exp_result', type: LinkType.RESULT, sourceId: 'p_exp', targetId: 's_export' },

          // Innards of Modeling System:
          { id: 'l_mod_1', type: LinkType.INVOCATION, sourceId: 'p_mod_create', targetId: 'p_mod_link' },
          { id: 'l_mod_2', type: LinkType.RESULT, sourceId: 'p_mod_link', targetId: 's_draft' },

          // Innards of Validating Model:
          { id: 'l_val_1', type: LinkType.CONSUMPTION, sourceId: 's_draft', targetId: 'p_val_scan' },
          { id: 'l_val_2', type: LinkType.INVOCATION, sourceId: 'p_val_scan', targetId: 'p_val_flag' },
          { id: 'l_val_3', type: LinkType.RESULT, sourceId: 'p_val_flag', targetId: 's_valid' },

          // Innards of Generating OPL:
          { id: 'l_gen_1', type: LinkType.CONSUMPTION, sourceId: 's_valid', targetId: 'p_gen_parse' },
          { id: 'l_gen_2', type: LinkType.INVOCATION, sourceId: 'p_gen_parse', targetId: 'p_gen_render' },
          { id: 'l_gen_3', type: LinkType.RESULT, sourceId: 'p_gen_render', targetId: 'opl_doc' },

          // Innards of Exporting:
          { id: 'l_exp_1', type: LinkType.CONSUMPTION, sourceId: 's_valid', targetId: 'p_exp_serialize' },
          { id: 'l_exp_2', type: LinkType.INVOCATION, sourceId: 'p_exp_serialize', targetId: 'p_exp_trigger' },
          { id: 'l_exp_3', type: LinkType.RESULT, sourceId: 'p_exp_trigger', targetId: 's_export' },
        ]
      },
      opds: [
        {
          id: 'opm-reflective-sd',
          name: 'SD',
          visual: {
            elements: [
              { id: 'user', x: 40, y: 170, width: 125, height: 60 },
              { id: 'tool', x: 380, y: 30, width: 120, height: 50 },
              { id: 'p_mod', x: 220, y: 120, width: 130, height: 60 },
              { id: 'p_val', x: 380, y: 120, width: 130, height: 60 },
              { id: 'p_gen_opl', x: 550, y: 120, width: 130, height: 60 },
              { id: 'p_exp', x: 470, y: 220, width: 130, height: 60 },
              { id: 'opl_doc', x: 720, y: 125, width: 110, height: 50 },
              { id: 'model_obj', x: 200, y: 330, width: 290, height: 155 },
              { id: 's_draft', x: 15, y: 30, width: 80, height: 35 },
              { id: 's_valid', x: 110, y: 85, width: 80, height: 35 },
              { id: 's_export', x: 195, y: 30, width: 80, height: 35 },
            ],
            links: [
              { id: 'l_user_mod' },
              { id: 'l_tool_mod' },
              { id: 'l_tool_val' },
              { id: 'l_tool_opl' },
              { id: 'l_tool_exp' },
              { id: 'l_mod_draft' },
              { id: 'l_val_consume' },
              { id: 'l_val_result' },
              { id: 'l_opl_consume' },
              { id: 'l_opl_result' },
              { id: 'l_exp_consume' },
              { id: 'l_exp_result' },
            ]
          }
        },
        {
          id: 'p_mod-in',
          name: 'Modeling System in-zoomed',
          parentProcessId: 'p_mod',
          visual: {
            elements: [
              { id: 'p_mod', x: 180, y: 80, width: 500, height: 260 },
              { id: 'user', x: 30, y: 185, width: 110, height: 50 },
              { id: 'tool', x: 380, y: 15, width: 110, height: 45 },
              { id: 'p_mod_create', x: 50, y: 100, width: 140, height: 55 },
              { id: 'p_mod_link', x: 260, y: 100, width: 140, height: 55 },
              { id: 'model_obj', x: 720, y: 185, width: 140, height: 95 },
              { id: 's_draft', x: 15, y: 30, width: 85, height: 35 },
            ],
            links: [
              { id: 'l_user_mod' },
              { id: 'l_tool_mod' },
              { id: 'l_mod_1' },
              { id: 'l_mod_2' },
            ]
          }
        },
        {
          id: 'p_val-in',
          name: 'Validating Model in-zoomed',
          parentProcessId: 'p_val',
          visual: {
            elements: [
              { id: 'p_val', x: 180, y: 80, width: 500, height: 260 },
              { id: 'tool', x: 380, y: 15, width: 110, height: 45 },
              { id: 'model_obj', x: 30, y: 380, width: 320, height: 110 },
              { id: 's_draft', x: 15, y: 35, width: 85, height: 35 },
              { id: 's_valid', x: 180, y: 35, width: 85, height: 35 },
              { id: 'p_val_scan', x: 40, y: 100, width: 180, height: 55 },
              { id: 'p_val_flag', x: 270, y: 100, width: 140, height: 55 },
            ],
            links: [
              { id: 'l_tool_val' },
              { id: 'l_val_1' },
              { id: 'l_val_2' },
              { id: 'l_val_3' },
            ]
          }
        },
        {
          id: 'p_gen_opl-in',
          name: 'Generating OPL in-zoomed',
          parentProcessId: 'p_gen_opl',
          visual: {
            elements: [
              { id: 'p_gen_opl', x: 180, y: 80, width: 500, height: 260 },
              { id: 'tool', x: 380, y: 15, width: 110, height: 45 },
              { id: 'model_obj', x: 30, y: 185, width: 120, height: 90 },
              { id: 's_valid', x: 15, y: 25, width: 85, height: 35 },
              { id: 'opl_doc', x: 720, y: 185, width: 110, height: 50 },
              { id: 'p_gen_parse', x: 50, y: 100, width: 140, height: 55 },
              { id: 'p_gen_render', x: 240, y: 100, width: 190, height: 55 },
            ],
            links: [
              { id: 'l_tool_opl' },
              { id: 'l_gen_1' },
              { id: 'l_gen_2' },
              { id: 'l_gen_3' },
            ]
          }
        },
        {
          id: 'p_exp-in',
          name: 'Exporting Model in-zoomed',
          parentProcessId: 'p_exp',
          visual: {
            elements: [
              { id: 'p_exp', x: 180, y: 80, width: 500, height: 260 },
              { id: 'tool', x: 380, y: 15, width: 110, height: 45 },
              { id: 'model_obj', x: 30, y: 380, width: 320, height: 110 },
              { id: 's_valid', x: 15, y: 35, width: 85, height: 35 },
              { id: 's_export', x: 180, y: 35, width: 85, height: 35 },
              { id: 'p_exp_serialize', x: 50, y: 100, width: 140, height: 55 },
              { id: 'p_exp_trigger', x: 260, y: 100, width: 140, height: 55 },
            ],
            links: [
              { id: 'l_tool_exp' },
              { id: 'l_exp_1' },
              { id: 'l_exp_2' },
              { id: 'l_exp_3' },
            ]
          }
        }
      ],
      currentOpdId: 'opm-reflective-sd'
    }
  },
  {
    id: 'structural-links-showcase',
    name: 'Car Structural Model',
    description: 'A dedicated OPM model showcasing the four key structural link types: Aggregation, Exhibition, Generalization, and Instantiation.',
    model: {
      logical: {
        elements: [
          { id: 'car', type: ElementType.OBJECT, name: 'Car', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'engine', type: ElementType.OBJECT, name: 'Engine', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'wheel', type: ElementType.OBJECT, name: 'Wheel', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'speed', type: ElementType.OBJECT, name: 'Speed', essence: Essence.INFORMATIONAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'electric-car', type: ElementType.OBJECT, name: 'Electric Car', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'combustion-car', type: ElementType.OBJECT, name: 'Combustion Car', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC },
          { id: 'my-tesla', type: ElementType.OBJECT, name: 'My Electric Car', essence: Essence.PHYSICAL, affiliation: Affiliation.SYSTEMIC }
        ],
        links: [
          { id: 'l_agg_engine', type: LinkType.AGGREGATION, sourceId: 'car', targetId: 'engine' },
          { id: 'l_agg_wheel', type: LinkType.AGGREGATION, sourceId: 'car', targetId: 'wheel' },
          { id: 'l_exh_speed', type: LinkType.EXHIBITION, sourceId: 'car', targetId: 'speed' },
          { id: 'l_gen_electric', type: LinkType.GENERALIZATION, sourceId: 'car', targetId: 'electric-car' },
          { id: 'l_gen_combustion', type: LinkType.GENERALIZATION, sourceId: 'car', targetId: 'combustion-car' },
          { id: 'l_inst_tesla', type: LinkType.INSTANTIATION, sourceId: 'electric-car', targetId: 'my-tesla' }
        ]
      },
      opds: [{
        id: 'car-sd',
        name: 'SD',
        visual: {
          elements: [
            { id: 'car', x: 340, y: 150, width: 120, height: 60 },
            { id: 'engine', x: 580, y: 70, width: 110, height: 50 },
            { id: 'wheel', x: 580, y: 180, width: 110, height: 50 },
            { id: 'speed', x: 100, y: 155, width: 110, height: 50 },
            { id: 'electric-car', x: 190, y: 320, width: 120, height: 60 },
            { id: 'combustion-car', x: 490, y: 320, width: 135, height: 60 },
            { id: 'my-tesla', x: 190, y: 460, width: 120, height: 60 }
          ],
          links: [
            { id: 'l_agg_engine' },
            { id: 'l_agg_wheel' },
            { id: 'l_exh_speed' },
            { id: 'l_gen_electric' },
            { id: 'l_gen_combustion' },
            { id: 'l_inst_tesla' }
          ]
        }
      }],
      currentOpdId: 'car-sd'
    }
  }
];
