import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Send, 
  FileSpreadsheet, 
  Tag, 
  User, 
  Layers, 
  Building2, 
  Share2,
  Maximize2
} from 'lucide-react';
import { TaskRecord, AppSettings } from '../types';
import { sendTaskToTelegram } from '../utils/telegramService';
import { syncTaskToGoogleSheets } from '../utils/sheetsService';

interface TaskDetailModalProps {
  task: TaskRecord | null;
  onClose: () => void;
  settings: AppSettings;
  onTaskUpdated?: (updatedTask: TaskRecord) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  settings,
  onTaskUpdated
}) => {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [isRetryingTelegram, setIsRetryingTelegram] = useState(false);
  const [isRetryingSheets, setIsRetryingSheets] = useState(false);

  if (!task) return null;

  const isPos = task.category === 'pos_soundbox';

  const handleRetryTelegram = async () => {
    setIsRetryingTelegram(true);
    const res = await sendTaskToTelegram(task, settings);
    setIsRetryingTelegram(false);

    if (res.success) {
      alert('Telegram dispatch successful!');
      if (onTaskUpdated) {
        onTaskUpdated({ ...task, telegramStatus: 'sent', telegramError: undefined });
      }
    } else {
      alert(`Telegram dispatch failed: ${res.error}`);
    }
  };

  const handleRetrySheets = async () => {
    setIsRetryingSheets(true);
    const res = await syncTaskToGoogleSheets(task, settings);
    setIsRetryingSheets(false);

    if (res.success) {
      alert('Google Sheets sync successful!');
      if (onTaskUpdated) {
        onTaskUpdated({ ...task, sheetsStatus: 'synced', sheetsError: undefined });
      }
    } else {
      alert(`Google Sheets sync failed: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className={`p-6 text-white ${isPos ? 'bg-gradient-to-r from-amber-700 to-orange-800' : 'bg-gradient-to-r from-blue-700 to-indigo-800'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  {isPos ? <Layers className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  {isPos ? 'POS & Soundbox Work' : 'Merchant Visit'}
                </span>
                <span className="text-white/70 text-xs font-mono">{task.id}</span>
              </div>
              <h2 className="text-xl font-bold">{task.merchantName || 'Unnamed Merchant'}</h2>
              <p className="text-xs text-white/90 mt-0.5">{task.activityLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Identifiers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] text-slate-500 block">Merchant ID (MID)</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{task.merchantId || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Terminal ID (TID)</span>
              <span className="font-mono font-semibold text-slate-800 text-sm">{task.terminalId || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Business Type</span>
              <span className="font-semibold text-slate-800 text-sm truncate block">{task.businessType}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Phone</span>
              <span className="font-semibold text-slate-800 text-sm">{task.phoneNumber || '—'}</span>
            </div>
          </div>

          {/* Location & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Location & Coordinates</span>
              </div>
              <p className="text-slate-600">
                {task.location.address || 'No address text provided'}
              </p>
              {task.location.latitude && task.location.longitude && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    {task.location.latitude.toFixed(5)}, {task.location.longitude.toFixed(5)}
                  </span>
                  <a
                    href={task.location.mapsUrl || `https://maps.google.com/?q=${task.location.latitude},${task.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Operating Hours</span>
              </div>
              <p className="text-slate-700 font-medium">
                {task.businessHours?.is24Hours
                  ? 'Open 24 Hours'
                  : `${task.businessHours?.openTime || '--:--'} to ${task.businessHours?.closeTime || '--:--'}`}
              </p>
              <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Recorded: {new Date(task.submittedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Hardware & Reasons */}
          {(task.deviceSerialNumber || task.reason) && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2 text-xs">
              {task.deviceSerialNumber && (
                <div>
                  <span className="font-semibold text-amber-900">Device Serial Number: </span>
                  <span className="font-mono text-amber-950 font-bold">{task.deviceSerialNumber}</span>
                </div>
              )}
              {task.reason && (
                <div>
                  <span className="font-semibold text-amber-900">Specific Detail / Reason: </span>
                  <span className="text-amber-950 font-medium">{task.reason}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Field Notes</span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {task.notes}
              </div>
            </div>
          )}

          {/* Attached Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Attached Photos ({task.images?.length || 0})
              </span>
              <span className="text-[11px] text-slate-500">
                Sent to Telegram (excluded from Google Sheets as configured)
              </span>
            </div>

            {task.images && task.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {task.images.map((img, i) => (
                  <div
                    key={img.id || i}
                    onClick={() => setActivePhoto(img.dataUrl)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100"
                  >
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                No photo proofs were attached for this record.
              </div>
            )}
          </div>

          {/* Integrations Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Integrations Delivery Status
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="font-semibold text-slate-700 block">Telegram Group</span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {task.telegramStatus === 'sent' ? 'Sent with photos' : task.telegramStatus}
                    </span>
                  </div>
                </div>
                {task.telegramStatus !== 'sent' && (
                  <button
                    onClick={handleRetryTelegram}
                    disabled={isRetryingTelegram}
                    className="text-xs text-blue-600 hover:underline font-semibold disabled:opacity-50"
                  >
                    {isRetryingTelegram ? 'Retrying...' : 'Retry'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold text-slate-700 block">Google Sheets</span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {task.sheetsStatus === 'synced' ? 'Synced (No images)' : task.sheetsStatus}
                    </span>
                  </div>
                </div>
                {task.sheetsStatus !== 'synced' && (
                  <button
                    onClick={handleRetrySheets}
                    disabled={isRetryingSheets}
                    className="text-xs text-emerald-600 hover:underline font-semibold disabled:opacity-50"
                  >
                    {isRetryingSheets ? 'Retrying...' : 'Retry'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Agent: <b>{task.submittedBy.userName}</b> ({task.submittedBy.userEmail})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Close View
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom Photo modal */}
      {activePhoto && (
        <div 
          onClick={() => setActivePhoto(null)} 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img 
            src={activePhoto} 
            alt="Enlarged" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
};
