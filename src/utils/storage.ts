import { TaskRecord, AppSettings, UserProfile } from '../types';
import { PRESET_USERS } from '../data/activityCatalog';

const STORAGE_KEYS = {
  TASKS: 'merchantops_tasks_v1',
  SETTINGS: 'merchantops_settings_v1',
  CURRENT_USER: 'merchantops_active_user_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  telegramBotToken: '',
  telegramChatId: '',
  telegramTopicId: '',
  telegramEnabled: true,
  
  googleSheetsWebhookUrl: '',
  googleSheetsEnabled: true,
  googleSheetName: 'Merchant_Activities',
  
  companyName: 'MerchantOps Field Force'
};

const SEED_TASKS: TaskRecord[] = [
  {
    id: 'TASK-2026-081',
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    submittedBy: {
      userId: 'user-01',
      userName: 'Dara Sok',
      userEmail: 'dara.sok@fieldops.com',
      role: 'user'
    },
    category: 'merchant_visit',
    activityId: 'mv-qr-check',
    activityLabel: 'Check the QR that is new and can still be used and fill in the Merchant information and record it in the system',
    merchantName: 'Brown Coffee Roastery',
    merchantId: 'KHQR0098231',
    terminalId: 'TID-BCR-01',
    phoneNumber: '+855 23 215 888',
    businessType: 'Restaurant & Cafe',
    location: {
      latitude: 11.5564,
      longitude: 104.9282,
      address: 'Street 51 Corner 302, BKK1, Phnom Penh',
      mapsUrl: 'https://maps.google.com/?q=11.5564,104.9282'
    },
    businessHours: {
      openTime: '06:30',
      closeTime: '21:00',
      is24Hours: false
    },
    notes: 'QR standee is clean and intact. Scanned successfully with EMVCo format. Cashier reported swift settlements.',
    images: [
      {
        id: 'img-seed-1',
        name: 'qr_standee_counter.jpg',
        size: 145000,
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23475569">QR Standee Verified</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%2364748b">Brown Coffee Counter 1</text></svg>'
      }
    ],
    telegramStatus: 'sent',
    sheetsStatus: 'synced'
  },
  {
    id: 'TASK-2026-080',
    submittedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(), // 2.5 hours ago
    submittedBy: {
      userId: 'user-02',
      userName: 'Vannak Meas',
      userEmail: 'vannak.meas@fieldops.com',
      role: 'user'
    },
    category: 'pos_soundbox',
    activityId: 'pos-new-install',
    activityLabel: 'New POS installation',
    merchantName: 'Lucky Supermarket Toul Kork',
    merchantId: 'KHQR0044199',
    terminalId: 'TID-LKY-08',
    deviceSerialNumber: 'PAX-A920-8849201',
    phoneNumber: '+855 12 776 543',
    businessType: 'Supermarket',
    location: {
      latitude: 11.5712,
      longitude: 104.8974,
      address: 'Street 315, Sangkat Boeung Kak 1, Khan Toul Kork',
      mapsUrl: 'https://maps.google.com/?q=11.5712,104.8974'
    },
    businessHours: {
      openTime: '08:00',
      closeTime: '22:00',
      is24Hours: false
    },
    notes: 'Installed brand new Android Smart POS PAX A920. Configured dual SIM 4G connectivity and performed $0.01 test transaction.',
    images: [
      {
        id: 'img-seed-2',
        name: 'pos_device_setup.jpg',
        size: 198000,
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23dbeafe"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%231e40af">POS Installation Complete</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%233b82f6">PAX-A920-8849201</text></svg>'
      }
    ],
    telegramStatus: 'sent',
    sheetsStatus: 'synced'
  },
  {
    id: 'TASK-2026-079',
    submittedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    submittedBy: {
      userId: 'user-01',
      userName: 'Dara Sok',
      userEmail: 'dara.sok@fieldops.com',
      role: 'user'
    },
    category: 'merchant_visit',
    activityId: 'mv-competitor-benefit',
    activityLabel: 'Merchant receives benefits from our competitors',
    merchantName: 'U-Care Pharmacy Central',
    merchantId: 'KHQR0077812',
    terminalId: '',
    phoneNumber: '+855 23 224 098',
    businessType: 'Pharmacy & Health',
    reason: 'Competitor provided 0% MDR fee for 6 months and sponsored dynamic LED merchant signage.',
    location: {
      latitude: 11.5621,
      longitude: 104.9214,
      address: 'Norodom Blvd, Sangkat Phsar Thmey 3, Daun Penh',
      mapsUrl: 'https://maps.google.com/?q=11.5621,104.9214'
    },
    businessHours: {
      openTime: '07:30',
      closeTime: '22:00',
      is24Hours: false
    },
    notes: 'Owner is willing to re-evaluate our proposal if we can match cashback rate for high volume pharmacy transactions.',
    images: [],
    telegramStatus: 'sent',
    sheetsStatus: 'synced'
  },
  {
    id: 'TASK-2026-078',
    submittedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    submittedBy: {
      userId: 'user-03',
      userName: 'Channtha Pich',
      userEmail: 'channtha.pich@fieldops.com',
      role: 'user'
    },
    category: 'pos_soundbox',
    activityId: 'sb-new-install',
    activityLabel: 'New soundbox installation',
    merchantName: 'Tube Cafe BKK',
    merchantId: 'KHQR0033109',
    terminalId: 'TID-SB-440',
    deviceSerialNumber: 'SBOX-G3-77291',
    phoneNumber: '+855 93 456 789',
    businessType: 'Restaurant & Cafe',
    location: {
      latitude: 11.5510,
      longitude: 104.9240,
      address: 'Street 360, BKK3, Phnom Penh',
      mapsUrl: 'https://maps.google.com/?q=11.5510,104.9240'
    },
    businessHours: {
      openTime: '07:00',
      closeTime: '20:00',
      is24Hours: false
    },
    notes: 'Configured Khmer audio broadcast for instant payment receipts. Speaker volume calibrated.',
    images: [],
    telegramStatus: 'sent',
    sheetsStatus: 'synced'
  },
  {
    id: 'TASK-2026-077',
    submittedAt: new Date(Date.now() - 1000 * 60 * 620).toISOString(),
    submittedBy: {
      userId: 'user-02',
      userName: 'Vannak Meas',
      userEmail: 'vannak.meas@fieldops.com',
      role: 'user'
    },
    category: 'pos_soundbox',
    activityId: 'pos-provide-paper-roll',
    activityLabel: 'Provide paper roll',
    merchantName: 'Master Suki Soup Monivong',
    merchantId: 'KHQR0066214',
    terminalId: 'TID-MSS-03',
    phoneNumber: '+855 23 724 111',
    businessType: 'Restaurant & Cafe',
    location: {
      latitude: 11.5588,
      longitude: 104.9192,
      address: 'Monivong Blvd, Phnom Penh',
      mapsUrl: 'https://maps.google.com/?q=11.5588,104.9192'
    },
    businessHours: {
      openTime: '10:00',
      closeTime: '22:30',
      is24Hours: false
    },
    notes: 'Provided 10 rolls of 57mm thermal printer paper. Checked paper feed roller.',
    images: [],
    telegramStatus: 'sent',
    sheetsStatus: 'synced'
  }
];

export function getStoredTasks(): TaskRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
      return SEED_TASKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_TASKS;
  } catch (e) {
    console.error('Failed reading tasks from storage', e);
    return SEED_TASKS;
  }
}

export function saveStoredTasks(tasks: TaskRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed saving tasks to storage', e);
  }
}

export function addTaskRecord(task: TaskRecord): TaskRecord[] {
  const current = getStoredTasks();
  const updated = [task, ...current];
  saveStoredTasks(updated);
  return updated;
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed saving settings', e);
  }
}

export function getActiveUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch {
    // fallback
  }
  // default active user is field agent 01
  return PRESET_USERS[0];
}

export function setActiveUser(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed saving user', e);
  }
}
