export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  team?: string;
}

export type ActivityCategory = 'merchant_visit' | 'pos_soundbox';

export interface ActivityOption {
  id: string;
  category: ActivityCategory;
  label: string;
  description?: string;
  requiresDeviceSN?: boolean;
  requiresReason?: boolean;
}

export type BusinessType = 
  | 'Restaurant & Cafe'
  | 'Grocery & Minimart'
  | 'Retail & Fashion'
  | 'Pharmacy & Health'
  | 'Electronics & Gadgets'
  | 'Beauty & Barber'
  | 'Supermarket'
  | 'Wholesale & Distribution'
  | 'Hotel & Hospitality'
  | 'Service & Maintenance'
  | 'Automotive'
  | 'Other';

export interface TaskImage {
  id: string;
  dataUrl: string; // base64 representation
  name: string;
  size: number;
}

export interface TaskRecord {
  id: string;
  submittedAt: string; // ISO string
  submittedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    role: UserRole;
  };
  
  // Categorization
  category: ActivityCategory;
  activityId: string;
  activityLabel: string;
  
  // Merchant Info
  merchantName: string;
  merchantId: string; // MID
  terminalId?: string; // TID
  phoneNumber: string;
  businessType: BusinessType;
  
  // Location
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    mapsUrl?: string;
  };
  
  // Business Hours
  businessHours: {
    openTime: string;
    closeTime: string;
    is24Hours?: boolean;
  };
  
  // Additional Fields
  deviceSerialNumber?: string; // for POS or Soundbox
  reason?: string; // for refusal, termination, competitor
  notes: string;
  
  // Attached Images (images are sent to Telegram but excluded from Google Sheets as requested)
  images: TaskImage[];
  
  // Integrations status
  telegramStatus: 'sent' | 'failed' | 'not_configured' | 'pending';
  telegramError?: string;
  telegramMessageId?: number;
  
  sheetsStatus: 'synced' | 'failed' | 'not_configured' | 'pending';
  sheetsError?: string;
}

export interface AppSettings {
  telegramBotToken: string;
  telegramChatId: string;
  telegramTopicId?: string;
  telegramEnabled: boolean;
  
  googleSheetsWebhookUrl: string;
  googleSheetsEnabled: boolean;
  googleSheetName?: string;
  
  companyName: string;
}
