/**
 * Default "what's included / what costs extra" per service. These populate the
 * Services collection's `inclusions`/`exclusions` (fully editable in the CMS afterward)
 * so every city × service page renders a real scope block instead of the built-in
 * fallback. Shared by the seed and the one-off backfill script.
 */
export interface ServiceScope {
  inclusions: string[];
  exclusions: string[];
}

export const SERVICE_SCOPE: Record<string, ServiceScope> = {
  'home-shifting': {
    inclusions: [
      'Professional packing & all materials',
      'Furniture dismantling & wrapping',
      'Loading and unloading by trained crew',
      'Transport in a dedicated vehicle',
      'Basic reassembly at your new home',
    ],
    exclusions: [
      'Civil, electrical or carpentry work',
      'Storage beyond the quoted period',
      'Third-party appliance servicing',
      'Octroi / entry taxes where applicable',
    ],
  },
  'office-shifting': {
    inclusions: [
      'IT, workstation & document packing',
      'Labelled inventory for every carton',
      'After-hours & weekend moves',
      'Loading, transport and unloading',
      'Reinstallation of workstations',
    ],
    exclusions: [
      'Server decommissioning by your vendor',
      'Structured network cabling',
      'New furniture purchase',
      'Storage beyond the quoted period',
    ],
  },
  'car-transport': {
    inclusions: [
      'Door-to-door pickup and delivery',
      'Open or enclosed carrier as chosen',
      'Wheel-lock and soft-tie securing',
      'Condition report at pickup',
      'Transit insurance option',
    ],
    exclusions: [
      'Fuel in the tank (kept low for safety)',
      'Toll / entry taxes at destination',
      'Aftermarket accessories unless declared',
      'RTO paperwork or registration changes',
    ],
  },
  'bike-transport': {
    inclusions: [
      'Bubble, foam and stretch wrapping',
      'Wooden crating on request',
      'Loading with ramps, no drops',
      'Condition report at pickup',
      'Transit insurance option',
    ],
    exclusions: [
      'Fuel drained for safe transit',
      'Aftermarket accessories unless declared',
      'Registration transfer',
      'Storage beyond the quoted period',
    ],
  },
  'loading-unloading': {
    inclusions: [
      'Trained labour crew',
      'Loading and safe stacking',
      'Rope and tie-down securing',
      'Unloading at the destination',
    ],
    exclusions: [
      'Packing materials (charged separately)',
      'Transport (this is labour-only)',
      'Furniture reassembly',
      'Long carry beyond the quoted distance',
    ],
  },
  'packing-unpacking': {
    inclusions: [
      'Multi-layer packing materials',
      'Fragile and appliance packing',
      'Clearly labelled cartons',
      'Unpacking at the destination',
      'Removal of packing debris',
    ],
    exclusions: [
      'Transport (this is packing-only)',
      'Loading / unloading unless added',
      'Storage of packed goods',
      'Civil or electrical work',
    ],
  },
  'international-relocation': {
    inclusions: [
      'Export-grade packing and crating',
      'Customs documentation support',
      'Sea / air freight booking',
      'Destination clearance coordination',
      'Marine transit insurance option',
    ],
    exclusions: [
      'Duties and taxes at destination',
      'Demurrage from delayed clearance',
      'Prohibited or restricted items',
      'Storage beyond the quoted period',
    ],
  },
};
