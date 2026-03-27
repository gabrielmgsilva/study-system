export type LicenceType = 'M' | 'E' | 'S' | 'B';

export type LogbookProfileId = 'm' | 'e' | 's' | 'balloons';

export type TaskGroup = {
  ata: string;
  title: string;
  tasks: string[];
};

export type LogbookProfile = {
  id: LogbookProfileId;
  licenceType: LicenceType;
  licenceSubtitle: string;
  coverHeading: string;
  printFooterLabel: string;
  taskListHeading: string;
  introLead: string;
  introFocus: string;
  completionExamples: {
    aircraftType: string;
    component: string;
    registration: string;
    serial: string;
  };
  taskGroups: TaskGroup[];
};

export const LOGBOOK_PROFILES: Record<LogbookProfileId, LogbookProfile> = {
  m: {
    id: 'm',
    licenceType: 'M',
    licenceSubtitle: 'Airplane & Helicopter',
    coverHeading: 'Transport Canada – Maintenance Task Log',
    printFooterLabel: 'AME ONE — M Logbook Module (Print edition)',
    taskListHeading: 'MAINTENANCE TASK LIST',
    introLead:
      'The Maintenance Task List below is based on paragraph 566.03(4)(e) and Appendix B of Chapter 566 of the Airworthiness.',
    introFocus:
      'This M profile focuses on general mechanical maintenance experience across airframe, powerplant and heavy maintenance checks.',
    completionExamples: {
      aircraftType: 'model based on aircraft Type Certificate Data Sheet (TCDS).',
      component: 'starter generator.',
      registration: 'aircraft marks e.g., C-GCFJ.',
      serial: 'serial number from the component data plate.',
    },
    taskGroups: [
      {
        ata: '05',
        title: 'Time limits Mtce Checks',
        tasks: [
          '100 hour check (general aviation aircraft)',
          'Involvement in A,B or C check (transport category aircraft)',
          'Review records for compliance with airworthiness directives',
          'Review records for compliance with component life limits',
          'Inspection following heavy landing',
          'Inspection following lightning strike',
        ],
      },
      {
        ata: '06',
        title: 'Dimensions/Areas',
        tasks: ['Locate components by station number', 'Perform symmetry check'],
      },
      {
        ata: '07',
        title: 'Lifting/Shoring',
        tasks: [
          'Jack aircraft nose or tail wheel',
          'Jack complete aircraft',
          'Sling or trestle major component',
        ],
      },
    ],
  },
  e: {
    id: 'e',
    licenceType: 'E',
    licenceSubtitle: 'Avionics',
    coverHeading: 'Transport Canada – Avionics Maintenance Task Log',
    printFooterLabel: 'AME ONE — E Logbook Module (Print edition)',
    taskListHeading: 'AVIONICS MAINTENANCE TASK LIST',
    introLead:
      'The Maintenance Task List below is aligned with paragraph 566.03(4)(e) and should be used to document avionics-focused practical experience.',
    introFocus:
      'This E profile emphasizes electrical power, communication, navigation and integrated avionics troubleshooting tasks.',
    completionExamples: {
      aircraftType: 'aircraft or avionics installation model as listed in the applicable technical data.',
      component: 'transceiver, ELT, EFIS display or wiring harness assembly.',
      registration: 'aircraft marks or installation reference, e.g., C-GCFJ.',
      serial: 'serial number from the avionics unit or controlled component tag.',
    },
    taskGroups: [
      {
        ata: '24',
        title: 'Electrical Power',
        tasks: [
          'Inspect aircraft electrical power distribution components',
          'Test continuity and insulation on an avionics wiring run',
          'Remove and install a battery, inverter or static inverter component',
        ],
      },
      {
        ata: '31',
        title: 'Instruments and Displays',
        tasks: [
          'Remove and install a flight instrument or EFIS display unit',
          'Configure or verify instrument indication against maintenance data',
          'Carry out a pitot-static or instrument system functional check',
        ],
      },
      {
        ata: '34',
        title: 'Navigation and Communication',
        tasks: [
          'Perform an operational check on a communication radio installation',
          'Inspect a navigation antenna, coaxial cable or bonding path',
          'Troubleshoot a navigation or communication system discrepancy',
        ],
      },
    ],
  },
  s: {
    id: 's',
    licenceType: 'S',
    licenceSubtitle: 'Structures',
    coverHeading: 'Transport Canada – Structures Maintenance Task Log',
    printFooterLabel: 'AME ONE — S Logbook Module (Print edition)',
    taskListHeading: 'STRUCTURES MAINTENANCE TASK LIST',
    introLead:
      'The Maintenance Task List below is aligned with paragraph 566.03(4)(e) and should be used to document structures-focused practical experience.',
    introFocus:
      'This S profile emphasizes structural inspection, repair, corrosion control and bonded or composite work.',
    completionExamples: {
      aircraftType: 'aircraft model or structural assembly reference from approved data.',
      component: 'skin panel, control surface, fairing or bonded assembly.',
      registration: 'aircraft marks or structural assembly identification, e.g., C-GCFJ.',
      serial: 'serial number or repair tracking number from the affected component.',
    },
    taskGroups: [
      {
        ata: '51',
        title: 'Standard Structures Practices',
        tasks: [
          'Inspect a structural area for damage, distortion or fastener condition',
          'Identify and evaluate corrosion in a primary or secondary structure',
          'Prepare a structural repair area in accordance with approved data',
        ],
      },
      {
        ata: '53',
        title: 'Fuselage Repairs',
        tasks: [
          'Fabricate or fit a sheet metal repair patch',
          'Remove and replace structural fasteners using approved practice',
          'Inspect fuselage skin or frames after repair or blending',
        ],
      },
      {
        ata: '57',
        title: 'Wings and Flight Controls',
        tasks: [
          'Inspect wing structure, attachment points or control surface hinges',
          'Carry out a repair on a fairing, panel or non-pressurized structure',
          'Complete a control surface balance or post-repair alignment check',
        ],
      },
    ],
  },
  balloons: {
    id: 'balloons',
    licenceType: 'B',
    licenceSubtitle: 'Balloon',
    coverHeading: 'Transport Canada – Balloons Maintenance Task Log',
    printFooterLabel: 'AME ONE — Balloons Logbook Module (Print edition)',
    taskListHeading: 'BALLOONS MAINTENANCE TASK LIST',
    introLead:
      'The Maintenance Task List below is aligned with paragraph 566.03(4)(e) and should be used to document practical experience for balloon maintenance.',
    introFocus:
      'This Balloons profile emphasizes envelope, basket, burner and fuel system maintenance tasks.',
    completionExamples: {
      aircraftType: 'balloon make/model or assembly reference from approved data.',
      component: 'burner unit, envelope panel, basket fitting or fuel cylinder assembly.',
      registration: 'aircraft marks or balloon registration, e.g., C-GCFJ.',
      serial: 'serial number from the burner, cylinder or identified component.',
    },
    taskGroups: [
      {
        ata: '11',
        title: 'Placards and General Inspection',
        tasks: [
          'Inspect balloon records, placards and configuration for conformity',
          'Carry out a general condition inspection of the basket and suspension system',
          'Verify continued airworthiness limitations and service information status',
        ],
      },
      {
        ata: '28',
        title: 'Fuel System',
        tasks: [
          'Inspect a fuel cylinder, valve and hose installation for condition and leaks',
          'Remove and install a balloon fuel cylinder or associated hardware',
          'Carry out a pressure or leak check of the balloon fuel supply system',
        ],
      },
      {
        ata: '73',
        title: 'Burner and Envelope',
        tasks: [
          'Inspect a burner assembly, igniter or support frame',
          'Inspect the envelope, load tapes or mouth area for damage and condition',
          'Perform a post-maintenance operational check on the burner system',
        ],
      },
    ],
  },
};

export function getLogbookProfile(profileId: LogbookProfileId): LogbookProfile {
  return LOGBOOK_PROFILES[profileId] ?? LOGBOOK_PROFILES.m;
}