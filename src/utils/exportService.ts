import * as XLSX from 'xlsx';
import { TaskRecord } from '../types';

export function exportTasksToExcel(tasks: TaskRecord[], filenamePrefix = 'MerchantOps_Report') {
  if (!tasks || tasks.length === 0) {
    alert('No tasks to export.');
    return;
  }

  // 1. Prepare main tasks rows
  const taskRows = tasks.map((t, index) => ({
    'No.': index + 1,
    'Task ID': t.id,
    'Date & Time': new Date(t.submittedAt).toLocaleString(),
    'Agent Name': t.submittedBy.userName,
    'Agent Email': t.submittedBy.userEmail,
    'Role': t.submittedBy.role,
    'Category': t.category === 'merchant_visit' ? 'Merchant Visit' : 'POS & Soundbox',
    'Activity Type': t.activityLabel,
    'Merchant Name': t.merchantName || 'N/A',
    'Merchant ID (MID)': t.merchantId || '',
    'Terminal ID (TID)': t.terminalId || '',
    'Phone Number': t.phoneNumber || '',
    'Business Type': t.businessType || '',
    'Opening Time': t.businessHours?.openTime || '',
    'Closing Time': t.businessHours?.closeTime || '',
    '24 Hours': t.businessHours?.is24Hours ? 'Yes' : 'No',
    'Latitude': t.location?.latitude || '',
    'Longitude': t.location?.longitude || '',
    'Address / Landmark': t.location?.address || '',
    'Google Maps URL': t.location?.mapsUrl || '',
    'Device S/N': t.deviceSerialNumber || '',
    'Reason / Detail': t.reason || '',
    'Additional Notes': t.notes || '',
    'Photos Attached': t.images?.length || 0,
    'Telegram Sync': t.telegramStatus,
    'Google Sheets Sync': t.sheetsStatus
  }));

  // 2. Prepare Summary Metrics
  const totalTasks = tasks.length;
  const merchantVisits = tasks.filter(t => t.category === 'merchant_visit').length;
  const posSoundboxTasks = tasks.filter(t => t.category === 'pos_soundbox').length;
  
  // Group by agent
  const agentMap: Record<string, number> = {};
  tasks.forEach(t => {
    const name = t.submittedBy.userName;
    agentMap[name] = (agentMap[name] || 0) + 1;
  });
  
  const summaryRows = [
    { 'Metric': 'Total Tasks Recorded', 'Value': totalTasks },
    { 'Metric': 'Merchant Visit Tasks', 'Value': merchantVisits },
    { 'Metric': 'POS & Soundbox Tasks', 'Value': posSoundboxTasks },
    { 'Metric': 'Export Timestamp', 'Value': new Date().toLocaleString() },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '--- Performance by Agent ---', 'Value': '' },
    ...Object.entries(agentMap).map(([agent, count]) => ({
      'Metric': agent,
      'Value': `${count} activities`
    }))
  ];

  const wb = XLSX.utils.book_new();
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  // Set column widths for readability
  wsTasks['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Task ID
    { wch: 20 }, // Date
    { wch: 18 }, // Agent
    { wch: 24 }, // Email
    { wch: 10 }, // Role
    { wch: 16 }, // Category
    { wch: 38 }, // Activity
    { wch: 24 }, // Merchant
    { wch: 16 }, // MID
    { wch: 14 }, // TID
    { wch: 16 }, // Phone
    { wch: 20 }, // Business Type
    { wch: 12 }, // Open
    { wch: 12 }, // Close
    { wch: 10 }, // 24h
    { wch: 12 }, // Lat
    { wch: 12 }, // Lng
    { wch: 28 }, // Address
    { wch: 35 }, // Maps
    { wch: 18 }, // Device SN
    { wch: 28 }, // Reason
    { wch: 35 }, // Notes
    { wch: 14 }, // Photos
    { wch: 14 }, // Telegram
    { wch: 14 }  // Sheets
  ];

  wsSummary['!cols'] = [
    { wch: 30 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks Data');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary & Stats');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}

/**
 * Print / Save PDF representation with formatted layout
 */
export function openPrintablePDFView(tasks: TaskRecord[], title = 'MerchantOps Field Activity Report') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF report.');
    return;
  }

  const dateStr = new Date().toLocaleString();
  const merchantVisits = tasks.filter(t => t.category === 'merchant_visit').length;
  const posTasks = tasks.filter(t => t.category === 'pos_soundbox').length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${dateStr}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .stats-bar { display: flex; gap: 20px; background: #f1f5f9; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; }
          .stat-item { font-size: 12px; }
          .stat-item strong { color: #0f172a; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 8px 6px; border: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
          td { padding: 6px; border: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) { background: #fafafa; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
          .badge-mv { background: #dbeafe; color: #1e40af; }
          .badge-pos { background: #fef3c7; color: #92400e; }
          .badge-success { background: #dcfce7; color: #166534; }
          .badge-warn { background: #fee2e2; color: #991b1b; }
          .notes { max-width: 200px; word-break: break-word; color: #475569; font-style: italic; }
          .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">
            🖨️ Print or Save as PDF
          </button>
          <button onclick="window.close()" style="background: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
            Close
          </button>
        </div>

        <div class="header">
          <div>
            <div class="title">${title}</div>
            <div class="subtitle">Official Field Force Task Log & Activity Records</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Generated:</strong> ${dateStr}</div>
            <div style="color: #64748b;">Records: ${tasks.length} items</div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-item">Total Tasks: <strong>${tasks.length}</strong></div>
          <div class="stat-item">Merchant Visits: <strong>${merchantVisits}</strong></div>
          <div class="stat-item">POS & Soundbox: <strong>${posTasks}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th style="width: 75px;">Date</th>
              <th style="width: 80px;">Agent</th>
              <th style="width: 90px;">Category</th>
              <th>Activity Description</th>
              <th style="width: 120px;">Merchant & MID</th>
              <th style="width: 80px;">TID / S/N</th>
              <th style="width: 85px;">Phone / Hours</th>
              <th style="width: 110px;">Location</th>
              <th>Notes / Reason</th>
              <th style="width: 45px;">Photos</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map((t, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${new Date(t.submittedAt).toLocaleDateString()}<br><small style="color:#64748b">${new Date(t.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                <td><strong>${t.submittedBy.userName}</strong></td>
                <td><span class="badge ${t.category === 'merchant_visit' ? 'badge-mv' : 'badge-pos'}">${t.category === 'merchant_visit' ? 'Merchant Visit' : 'POS & Soundbox'}</span></td>
                <td><strong>${t.activityLabel}</strong></td>
                <td>
                  <strong>${t.merchantName || 'N/A'}</strong><br>
                  <small style="color: #64748b;">MID: ${t.merchantId || '-'}</small><br>
                  <small style="color: #2563eb;">${t.businessType}</small>
                </td>
                <td>
                  ${t.terminalId ? `<div>TID: <code>${t.terminalId}</code></div>` : ''}
                  ${t.deviceSerialNumber ? `<div>S/N: <code>${t.deviceSerialNumber}</code></div>` : '-'}
                </td>
                <td>
                  ${t.phoneNumber ? `<div>${t.phoneNumber}</div>` : '-'}
                  <small style="color: #64748b;">${t.businessHours?.is24Hours ? '24h' : (t.businessHours?.openTime ? `${t.businessHours.openTime}-${t.businessHours.closeTime}` : '')}</small>
                </td>
                <td>
                  ${t.location?.address ? `<div>${t.location.address}</div>` : ''}
                  ${t.location?.latitude ? `<small style="color:#64748b;">${t.location.latitude.toFixed(4)}, ${t.location.longitude?.toFixed(4)}</small>` : '-'}
                </td>
                <td class="notes">
                  ${t.reason ? `<div style="color:#b91c1c; font-weight:600; margin-bottom:2px;">Refusal/Issue: ${t.reason}</div>` : ''}
                  ${t.notes || '-'}
                </td>
                <td style="text-align: center;">
                  ${t.images?.length ? `<strong>${t.images.length}</strong>` : '0'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          MerchantOps Field Activity Management System • Exported on ${dateStr} • Confidential
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
