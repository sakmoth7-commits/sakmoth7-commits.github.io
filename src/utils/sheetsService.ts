import { TaskRecord, AppSettings } from '../types';

export interface GoogleSheetsRow {
  taskId: string;
  submittedAt: string;
  agentName: string;
  agentEmail: string;
  category: string;
  activityLabel: string;
  merchantName: string;
  merchantId: string;
  terminalId: string;
  phoneNumber: string;
  businessType: string;
  openTime: string;
  closeTime: string;
  is24Hours: string;
  latitude: string;
  longitude: string;
  address: string;
  googleMapsUrl: string;
  deviceSerialNumber: string;
  reason: string;
  notes: string;
  photoCount: number; // Only photo count is recorded, NOT raw image binaries
}

export function formatTaskForSheet(task: TaskRecord): GoogleSheetsRow {
  return {
    taskId: task.id,
    submittedAt: task.submittedAt,
    agentName: task.submittedBy.userName,
    agentEmail: task.submittedBy.userEmail,
    category: task.category === 'merchant_visit' ? 'Merchant Visit' : 'POS & Soundbox',
    activityLabel: task.activityLabel,
    merchantName: task.merchantName || '',
    merchantId: task.merchantId || '',
    terminalId: task.terminalId || '',
    phoneNumber: task.phoneNumber || '',
    businessType: task.businessType,
    openTime: task.businessHours?.openTime || '',
    closeTime: task.businessHours?.closeTime || '',
    is24Hours: task.businessHours?.is24Hours ? 'Yes' : 'No',
    latitude: task.location?.latitude?.toString() || '',
    longitude: task.location?.longitude?.toString() || '',
    address: task.location?.address || '',
    googleMapsUrl: task.location?.mapsUrl || '',
    deviceSerialNumber: task.deviceSerialNumber || '',
    reason: task.reason || '',
    notes: task.notes || '',
    photoCount: task.images?.length || 0
  };
}

/**
 * Send task data (excluding images) to Google Sheets Webhook
 */
export async function syncTaskToGoogleSheets(
  task: TaskRecord,
  settings: AppSettings
): Promise<{ success: boolean; error?: string; isMock?: boolean }> {
  const webhookUrl = settings.googleSheetsWebhookUrl?.trim();
  
  if (!settings.googleSheetsEnabled || !webhookUrl) {
    return {
      success: true,
      isMock: true,
      error: 'Google Sheets Webhook URL not configured (Saved in local storage mode)'
    };
  }

  const payload = formatTaskForSheet(task);

  try {
    // Google Apps Script redirects with 302, standard fetch needs mode: 'no-cors' or handles standard JSON
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // standard for Google Apps Script Web App without CORS preflight failures
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    // In no-cors mode, type is 'opaque', meaning browser sent it successfully
    if (response.type === 'opaque' || response.ok) {
      return { success: true };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error syncing to Google Sheets:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Copy-paste ready Google Apps Script code for the user
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// Google Apps Script Webhook for MerchantOps Field App
// -------------------------------------------------------------
// Instructions:
// 1. In your Google Sheet, go to Extensions > Apps Script
// 2. Replace all code in Code.gs with this script
// 3. Click "Deploy" > "New deployment"
// 4. Select type: "Web app"
// 5. Execute as: "Me"
// 6. Who has access: "Anyone" (CRITICAL: must be Anyone)
// 7. Click "Deploy" and copy the Web App URL into MerchantOps Settings!
// -------------------------------------------------------------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName("Merchant_Activities") || doc.getActiveSheet();
    
    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Task ID",
        "Submitted At",
        "Agent Name",
        "Agent Email",
        "Category",
        "Activity Label",
        "Merchant Name",
        "Merchant ID (MID)",
        "Terminal ID (TID)",
        "Phone Number",
        "Business Type",
        "Open Time",
        "Close Time",
        "24 Hours?",
        "Latitude",
        "Longitude",
        "Address",
        "Google Maps Link",
        "Device S/N",
        "Reason / Refusal Detail",
        "Notes",
        "Photos Count"
      ]);
      sheet.getRange(1, 1, 1, 22).setFontWeight("bold").setBackground("#2563EB").setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.taskId || "",
      data.submittedAt || new Date().toISOString(),
      data.agentName || "",
      data.agentEmail || "",
      data.category || "",
      data.activityLabel || "",
      data.merchantName || "",
      data.merchantId || "",
      data.terminalId || "",
      data.phoneNumber || "",
      data.businessType || "",
      data.openTime || "",
      data.closeTime || "",
      data.is24Hours || "No",
      data.latitude || "",
      data.longitude || "",
      data.address || "",
      data.googleMapsUrl || "",
      data.deviceSerialNumber || "",
      data.reason || "",
      data.notes || "",
      data.photoCount || 0
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
