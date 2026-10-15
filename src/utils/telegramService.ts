import { TaskRecord, AppSettings } from '../types';

/**
 * Convert Data URL (Base64) to Blob for Telegram multipart upload
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function formatTelegramMessage(task: TaskRecord): string {
  const isPos = task.category === 'pos_soundbox';
  const categoryHeader = isPos ? '🛠️ POS & SOUNDBOX FIELD LOG' : '🏪 MERCHANT VISIT FIELD LOG';
  
  const mapsLink = task.location.mapsUrl || 
    (task.location.latitude && task.location.longitude 
      ? `https://maps.google.com/?q=${task.location.latitude},${task.location.longitude}`
      : '');

  let text = `<b>${categoryHeader}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏪 <b>Merchant:</b> <b>${escapeHTML(task.merchantName || 'Unnamed Merchant')}</b>\n`;
  text += `📋 <b>Activity:</b> ${escapeHTML(task.activityLabel)}\n`;
  text += `🏷️ <b>Type:</b> ${escapeHTML(task.businessType)}\n`;
  text += `\n`;
  text += `🆔 <b>MID:</b> <code>${escapeHTML(task.merchantId || 'N/A')}</code>\n`;
  if (task.terminalId) {
    text += `💳 <b>TID:</b> <code>${escapeHTML(task.terminalId)}</code>\n`;
  }
  if (task.deviceSerialNumber) {
    text += `⚙️ <b>Device S/N:</b> <code>${escapeHTML(task.deviceSerialNumber)}</code>\n`;
  }
  text += `📞 <b>Phone:</b> ${escapeHTML(task.phoneNumber || 'N/A')}\n`;
  
  if (task.businessHours) {
    const hours = task.businessHours.is24Hours 
      ? '24 Hours Open' 
      : `${task.businessHours.openTime || '--:--'} - ${task.businessHours.closeTime || '--:--'}`;
    text += `⏰ <b>Hours:</b> ${hours}\n`;
  }
  
  if (mapsLink) {
    text += `📍 <b>Map Location:</b> <a href="${mapsLink}">Open in Google Maps</a>\n`;
  }
  if (task.location.address) {
    text += `📍 <b>Address:</b> ${escapeHTML(task.location.address)}\n`;
  }
  
  if (task.reason) {
    text += `\n⚠️ <b>Reason / Cause:</b>\n${escapeHTML(task.reason)}\n`;
  }
  
  if (task.notes) {
    text += `\n📝 <b>Notes / Action Taken:</b>\n${escapeHTML(task.notes)}\n`;
  }
  
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 <b>Field Agent:</b> ${escapeHTML(task.submittedBy.userName)}\n`;
  text += `🕒 <b>Time:</b> ${new Date(task.submittedAt).toLocaleString()}\n`;
  text += `🔖 <b>Record ID:</b> <code>${task.id}</code>`;

  return text;
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
  isMock?: boolean;
}

/**
 * Send task information and images to Telegram Group
 */
export async function sendTaskToTelegram(
  task: TaskRecord,
  settings: AppSettings
): Promise<TelegramSendResult> {
  const token = settings.telegramBotToken?.trim();
  const chatId = settings.telegramChatId?.trim();
  
  if (!settings.telegramEnabled || !token || !chatId) {
    return {
      success: true,
      isMock: true,
      error: 'Telegram token or chat ID not configured (Saved in local preview mode)'
    };
  }

  const messageText = formatTelegramMessage(task);

  try {
    // Case 1: No images attached -> Simple sendMessage
    if (!task.images || task.images.length === 0) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
          ...(settings.telegramTopicId ? { message_thread_id: parseInt(settings.telegramTopicId, 10) } : {})
        })
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description || 'Telegram API error');
      }
      return { success: true, messageId: data.result?.message_id };
    }

    // Case 2: Single image -> sendPhoto
    if (task.images.length === 1) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      if (settings.telegramTopicId) {
        formData.append('message_thread_id', settings.telegramTopicId);
      }
      formData.append('caption', messageText);
      formData.append('parse_mode', 'HTML');
      
      const blob = dataURLtoBlob(task.images[0].dataUrl);
      formData.append('photo', blob, task.images[0].name || 'merchant_activity.jpg');

      const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description || 'Telegram API photo upload error');
      }
      return { success: true, messageId: data.result?.message_id };
    }

    // Case 3: Multiple images -> sendMediaGroup
    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (settings.telegramTopicId) {
      formData.append('message_thread_id', settings.telegramTopicId);
    }

    // Up to 10 photos per media group in Telegram API
    const imageBatch = task.images.slice(0, 10);
    const mediaList = imageBatch.map((img, index) => {
      const attachKey = `photo_${index}`;
      const blob = dataURLtoBlob(img.dataUrl);
      formData.append(attachKey, blob, img.name || `photo_${index}.jpg`);
      
      return {
        type: 'photo',
        media: `attach://${attachKey}`,
        caption: index === 0 ? messageText : '',
        parse_mode: index === 0 ? 'HTML' : undefined
      };
    });

    formData.append('media', JSON.stringify(mediaList));

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!data.ok) {
      // Fallback: send text first then send photos
      return await sendFallbackSequential(token, chatId, messageText, task.images, settings.telegramTopicId);
    }

    const firstMsgId = Array.isArray(data.result) ? data.result[0]?.message_id : undefined;
    return { success: true, messageId: firstMsgId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error sending to Telegram:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

async function sendFallbackSequential(
  token: string,
  chatId: string,
  caption: string,
  images: { dataUrl: string; name: string }[],
  topicId?: string
): Promise<TelegramSendResult> {
  // Send message first
  const msgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: caption,
      parse_mode: 'HTML',
      ...(topicId ? { message_thread_id: parseInt(topicId, 10) } : {})
    })
  });
  const msgData = await msgRes.json();
  
  // Send photos
  for (let i = 0; i < Math.min(images.length, 5); i++) {
    const fd = new FormData();
    fd.append('chat_id', chatId);
    if (topicId) fd.append('message_thread_id', topicId);
    fd.append('photo', dataURLtoBlob(images[i].dataUrl), images[i].name || `img_${i}.jpg`);
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: fd });
  }

  return { success: true, messageId: msgData.result?.message_id };
}

/**
 * Test Telegram bot connection and chat permissions
 */
export async function testTelegramBot(token: string, chatId: string): Promise<{ ok: boolean; message: string; botUsername?: string }> {
  try {
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await getMeRes.json();
    if (!meData.ok) {
      return { ok: false, message: `Invalid Bot Token: ${meData.description}` };
    }

    const botName = meData.result?.username;
    
    // Send test ping to the chat
    const pingRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 <b>MerchantOps Bot Connection Verified</b>\n\n✅ Bot: @${botName}\nConnected successfully to this chat! Field task updates and merchant photos will be posted here.`,
        parse_mode: 'HTML'
      })
    });
    const pingData = await pingRes.json();
    if (!pingData.ok) {
      return {
        ok: false,
        botUsername: botName,
        message: `Bot exists (@${botName}), but cannot post to Chat ID ${chatId}: ${pingData.description}. Ensure the bot is added as an administrator or member to the group.`
      };
    }

    return { ok: true, botUsername: botName, message: `Connected to @${botName} and test message posted to Group!` };
  } catch (err: unknown) {
    return { ok: false, message: `Network error connecting to Telegram API: ${err instanceof Error ? err.message : String(err)}` };
  }
}
