import { ActivityOption, BusinessType, UserProfile } from '../types';

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  // 1. Merchant Visit
  {
    id: 'mv-qr-check',
    category: 'merchant_visit',
    label: 'Check the QR that is new and can still be used and fill in the Merchant information and record it in the system',
    description: 'Verify QR sticker/standee status, scan QR to decode MID & info, record into system'
  },
  {
    id: 'mv-refuse-product',
    category: 'merchant_visit',
    label: 'Merchant who refuses to use our products',
    description: 'Record refusal reason, current alternative solutions used by merchant',
    requiresReason: true
  },
  {
    id: 'mv-cash-only',
    category: 'merchant_visit',
    label: 'Merchant who accepts cash only',
    description: 'Merchant reluctant or strictly cash-based, record pitch feedback'
  },
  {
    id: 'mv-no-use-reason',
    category: 'merchant_visit',
    label: 'Merchant does not use for any reason',
    description: 'Inactive merchant investigation and root cause documentation',
    requiresReason: true
  },
  {
    id: 'mv-competitor-benefit',
    category: 'merchant_visit',
    label: 'Merchant receives benefits from our competitors',
    description: 'Detail competitor offerings, cashbacks, MDR rates, or gifts',
    requiresReason: true
  },
  {
    id: 'mv-app-cannot-open',
    category: 'merchant_visit',
    label: 'His mobile application cannot be opened',
    description: 'Merchant app technical issue, device model, crash report, OS version'
  },
  {
    id: 'mv-onboard-new',
    category: 'merchant_visit',
    label: 'Onboard new merchant',
    description: 'New merchant acquisition, registration verification, sticker placement'
  },
  {
    id: 'mv-open-ia-account',
    category: 'merchant_visit',
    label: 'open IA account',
    description: 'Internal / Instant / Individual Agent account opening process'
  },
  {
    id: 'mv-check-location-machine',
    category: 'merchant_visit',
    label: 'Check the location for renting an automatic machine',
    description: 'Site survey, electrical outlet, foot traffic, security for kiosk/ATM/vending machine'
  },
  {
    id: 'mv-bring-docs-sign',
    category: 'merchant_visit',
    label: 'Bring documents to Merchant Sign',
    description: 'Contract signing, KYC documents, banking resolution delivery'
  },

  // 2. POS and Soundbox work
  {
    id: 'pos-new-install',
    category: 'pos_soundbox',
    label: 'New POS installation',
    description: 'Setup and deploy new terminal with SIM/WiFi and print test slip',
    requiresDeviceSN: true
  },
  {
    id: 'pos-replacement',
    category: 'pos_soundbox',
    label: 'Replacement POS',
    description: 'Replace faulty or obsolete POS terminal with fresh unit',
    requiresDeviceSN: true
  },
  {
    id: 'pos-maintenance',
    category: 'pos_soundbox',
    label: 'Maintenance POS',
    description: 'Cleaning, software update, key injection check, peripheral test',
    requiresDeviceSN: true
  },
  {
    id: 'pos-return-termination',
    category: 'pos_soundbox',
    label: 'POS Return/Termination',
    description: 'Retrieve POS terminal, cables, base, record return condition',
    requiresDeviceSN: true,
    requiresReason: true
  },
  {
    id: 'pos-battery-replacement',
    category: 'pos_soundbox',
    label: 'Battery POS replacement',
    description: 'Replace degraded battery pack in POS unit',
    requiresDeviceSN: true
  },
  {
    id: 'pos-fixed-issue',
    category: 'pos_soundbox',
    label: 'Fixed POS issue',
    description: 'Resolve connection, printing, or transaction error on-site',
    requiresDeviceSN: true
  },
  {
    id: 'pos-provide-paper-roll',
    category: 'pos_soundbox',
    label: 'Provide paper roll',
    description: 'Deliver thermal paper rolls (57mm x 40mm / 80mm) to merchant'
  },
  {
    id: 'sb-new-install',
    category: 'pos_soundbox',
    label: 'New soundbox installation',
    description: 'Deploy audio soundbox speaker, pair with merchant QR ID',
    requiresDeviceSN: true
  },
  {
    id: 'sb-replacement',
    category: 'pos_soundbox',
    label: 'soundbox replacement',
    description: 'Swap out defective soundbox speaker with new hardware',
    requiresDeviceSN: true
  },
  {
    id: 'sb-maintenance',
    category: 'pos_soundbox',
    label: 'Maintenance Soundbox',
    description: 'Volume test, voice alert verification, 4G SIM signal check',
    requiresDeviceSN: true
  },
  {
    id: 'sb-fixed-issue',
    category: 'pos_soundbox',
    label: 'fixed Soundbox issue',
    description: 'Troubleshoot audio glitch, network disconnection, or sync delay',
    requiresDeviceSN: true
  },
  {
    id: 'sb-return-termination',
    category: 'pos_soundbox',
    label: 'Sounbox return/termination',
    description: 'Retrieve soundbox equipment from merchant upon contract end',
    requiresDeviceSN: true,
    requiresReason: true
  },
  {
    id: 'sb-battery-replacement',
    category: 'pos_soundbox',
    label: 'Sounbox battery replacement',
    description: 'Replace internal soundbox battery or power adapter',
    requiresDeviceSN: true
  }
];

export const BUSINESS_TYPES: BusinessType[] = [
  'Restaurant & Cafe',
  'Grocery & Minimart',
  'Retail & Fashion',
  'Pharmacy & Health',
  'Electronics & Gadgets',
  'Beauty & Barber',
  'Supermarket',
  'Wholesale & Distribution',
  'Hotel & Hospitality',
  'Service & Maintenance',
  'Automotive',
  'Other'
];

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'user-01',
    name: 'Dara Sok',
    email: 'dara.sok@fieldops.com',
    role: 'user',
    phone: '+855 12 889 001',
    team: 'Phnom Penh Central Team'
  },
  {
    id: 'user-02',
    name: 'Vannak Meas',
    email: 'vannak.meas@fieldops.com',
    role: 'user',
    phone: '+855 12 889 002',
    team: 'Toul Kork & Sen Sok Team'
  },
  {
    id: 'user-03',
    name: 'Channtha Pich',
    email: 'channtha.pich@fieldops.com',
    role: 'user',
    phone: '+855 12 889 003',
    team: 'BKK & Chamkarmon Team'
  },
  {
    id: 'admin-01',
    name: 'Operations Manager (Admin)',
    email: 'admin.ops@fieldops.com',
    role: 'admin',
    phone: '+855 23 999 888',
    team: 'Headquarters Operations'
  }
];
