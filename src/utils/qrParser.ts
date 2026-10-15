export interface ParsedQRResult {
  merchantName?: string;
  merchantId?: string;
  terminalId?: string;
  countryCode?: string;
  city?: string;
  detectedFormat: 'emvco' | 'json' | 'url' | 'keyvalue' | 'plain';
  rawText: string;
}

/**
 * Parse EMVCo / KHQR / PromptPay / TLV format (Tag-Length-Value)
 */
function parseEMVCoTLV(raw: string): Record<string, string> {
  const tags: Record<string, string> = {};
  let idx = 0;
  
  while (idx < raw.length - 4) {
    const tag = raw.substring(idx, idx + 2);
    const lenStr = raw.substring(idx + 2, idx + 4);
    const len = parseInt(lenStr, 10);
    
    if (isNaN(len) || idx + 4 + len > raw.length) {
      break;
    }
    
    const val = raw.substring(idx + 4, idx + 4 + len);
    tags[tag] = val;
    idx += 4 + len;
  }
  
  return tags;
}

/**
 * Parse sub-tags inside an EMVCo tag (e.g. tag 62 additional data, or tag 29/30 merchant account info)
 */
function parseSubTLV(val: string): Record<string, string> {
  return parseEMVCoTLV(val);
}

export function parseMerchantQR(rawText: string): ParsedQRResult {
  const trimmed = rawText.trim();
  
  // 1. Check for EMVCo / KHQR format (starts with 000201...)
  if (trimmed.startsWith('000201') || (/^00\d{2}/.test(trimmed) && trimmed.length > 20)) {
    const tags = parseEMVCoTLV(trimmed);
    
    let merchantName = tags['59']; // Tag 59 is Merchant Name in EMVCo
    let city = tags['60']; // Tag 60 is Merchant City
    let countryCode = tags['58']; // Tag 58
    let merchantId = '';
    let terminalId = '';
    
    // Look through merchant account info tags 26 to 51
    for (let t = 26; t <= 51; t++) {
      const tagStr = t.toString().padStart(2, '0');
      if (tags[tagStr]) {
        const sub = parseSubTLV(tags[tagStr]);
        // Often subtag 01 or 02 or raw value has the MID / account
        if (sub['01'] || sub['02'] || sub['00']) {
          merchantId = sub['01'] || sub['02'] || sub['00'] || tags[tagStr];
          break;
        } else {
          merchantId = tags[tagStr];
          break;
        }
      }
    }
    
    // Check Tag 62 (Additional Data Field Template)
    if (tags['62']) {
      const addData = parseSubTLV(tags['62']);
      if (addData['07']) { // Tag 07 is Terminal ID
        terminalId = addData['07'];
      }
      if (!merchantId && addData['05']) { // Reference
        merchantId = addData['05'];
      }
      if (!merchantName && addData['08']) { // Store label
        merchantName = addData['08'];
      }
    }
    
    return {
      merchantName: merchantName ? merchantName.trim() : undefined,
      merchantId: merchantId ? merchantId.trim() : undefined,
      terminalId: terminalId ? terminalId.trim() : undefined,
      city,
      countryCode,
      detectedFormat: 'emvco',
      rawText: trimmed
    };
  }
  
  // 2. Check for JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      return {
        merchantName: obj.merchantName || obj.name || obj.merchant || obj.storeName,
        merchantId: obj.merchantId || obj.mid || obj.id || obj.mId,
        terminalId: obj.terminalId || obj.tid || obj.terminal || obj.tId,
        detectedFormat: 'json',
        rawText: trimmed
      };
    } catch {
      // not valid JSON, continue to next
    }
  }
  
  // 3. Check for URL format (e.g. payment link or qr link)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const params = url.searchParams;
      const mid = params.get('mid') || params.get('merchantId') || params.get('mId') || params.get('id');
      const name = params.get('name') || params.get('merchantName') || params.get('merchant') || params.get('store');
      const tid = params.get('tid') || params.get('terminalId') || params.get('terminal');
      
      return {
        merchantName: name ? decodeURIComponent(name) : undefined,
        merchantId: mid || undefined,
        terminalId: tid || undefined,
        detectedFormat: 'url',
        rawText: trimmed
      };
    } catch {
      // fallback
    }
  }
  
  // 4. Check for Key-Value pairs like "MID: 12345\nMerchant: ABC Store\nTID: 9988"
  const lines = trimmed.split(/[\n;,]/);
  let parsedName: string | undefined;
  let parsedMid: string | undefined;
  let parsedTid: string | undefined;
  
  for (const line of lines) {
    const [key, ...vals] = line.split(/[:=]/);
    if (key && vals.length > 0) {
      const k = key.trim().toLowerCase();
      const v = vals.join(':').trim();
      if (k.includes('mid') || k.includes('merchant id') || k.includes('merchant_id') || k === 'id') {
        parsedMid = v;
      } else if (k.includes('tid') || k.includes('terminal id') || k.includes('terminal_id')) {
        parsedTid = v;
      } else if (k.includes('merchant') || k.includes('name') || k.includes('store') || k.includes('shop')) {
        parsedName = v;
      }
    }
  }
  
  if (parsedName || parsedMid || parsedTid) {
    return {
      merchantName: parsedName,
      merchantId: parsedMid,
      terminalId: parsedTid,
      detectedFormat: 'keyvalue',
      rawText: trimmed
    };
  }
  
  // 5. Plain text fallback: check if looks like an ID string
  const midMatch = trimmed.match(/(?:MID|Merchant ID)?\s*[:#-]?\s*([A-Z0-9]{6,16})/i);
  return {
    merchantId: midMatch ? midMatch[1] : undefined,
    merchantName: trimmed.length < 50 && !/^\d+$/.test(trimmed) ? trimmed : undefined,
    detectedFormat: 'plain',
    rawText: trimmed
  };
}
