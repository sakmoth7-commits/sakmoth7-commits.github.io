import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Camera, 
  Send, 
  QrCode, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Phone, 
  FileText, 
  Info,
  Compass,
  ArrowRight
} from 'lucide-react';
import { 
  ActivityCategory, 
  BusinessType, 
  TaskImage, 
  TaskRecord, 
  UserProfile, 
  AppSettings 
} from '../types';
import { ACTIVITY_OPTIONS, BUSINESS_TYPES } from '../data/activityCatalog';
import { QRScannerModal } from './QRScannerModal';
import { ParsedQRResult } from '../utils/qrParser';
import { sendTaskToTelegram } from '../utils/telegramService';
import { syncTaskToGoogleSheets } from '../utils/sheetsService';
import { addTaskRecord } from '../utils/storage';

interface TaskFormProps {
  currentUser: UserProfile;
  settings: AppSettings;
  onTaskCreated: (task: TaskRecord) => void;
  onViewSubmissions: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  currentUser,
  settings,
  onTaskCreated,
  onViewSubmissions
}) => {
  // Form State
  const [category, setCategory] = useState<ActivityCategory>('merchant_visit');
  const [activityId, setActivityId] = useState<string>('mv-qr-check');
  
  const [merchantName, setMerchantName] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('Restaurant & Cafe');
  
  // Location
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  
  // Hours
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [is24Hours, setIs24Hours] = useState(false);
  
  // Specific fields
  const [deviceSerialNumber, setDeviceSerialNumber] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  // Images
  const [images, setImages] = useState<TaskImage[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  
  // Modals & Submitting
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [lastSubmittedTask, setLastSubmittedTask] = useState<TaskRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter activities based on selected category
  const currentCategoryActivities = ACTIVITY_OPTIONS.filter(a => a.category === category);
  const currentActivityObj = ACTIVITY_OPTIONS.find(a => a.id === activityId) || currentCategoryActivities[0];

  // Geolocation trigger
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        setLocationSuccess(true);
        if (!address) {
          setAddress(`GPS Lat: ${lat}, Lng: ${lng}`);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert(`Location fetch error: ${err.message}. You can manually type the address/location.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Image resize and base64 compression helper to keep app fast and under payload bounds
  const compressImage = (file: File): Promise<TaskImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200; // max resolution
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            dataUrl: compressedDataUrl,
            name: file.name,
            size: Math.round((compressedDataUrl.length * 3) / 4)
          });
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed: TaskImage[] = [];
      for (let i = 0; i < files.length; i++) {
        if (images.length + processed.length >= 8) {
          alert('Maximum 8 photos allowed per task report.');
          break;
        }
        const img = await compressImage(files[i]);
        processed.push(img);
      }
      setImages(prev => [...prev, ...processed]);
    } catch (err) {
      console.error(err);
      alert('Error processing one or more photos.');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (imgId: string) => {
    setImages(prev => prev.filter(img => img.id !== imgId));
  };

  // QR Scan callback
  const handleQRComplete = (qr: ParsedQRResult) => {
    if (qr.merchantName) setMerchantName(qr.merchantName);
    if (qr.merchantId) setMerchantId(qr.merchantId);
    if (qr.terminalId) setTerminalId(qr.terminalId);
    if (qr.city && !address) setAddress(qr.city);
  };

  // Category change helper
  const handleCategoryChange = (newCat: ActivityCategory) => {
    setCategory(newCat);
    const firstActivity = ACTIVITY_OPTIONS.find(a => a.category === newCat);
    if (firstActivity) {
      setActivityId(firstActivity.id);
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!merchantName.trim()) {
      setFormError('Merchant Name is required. You can type it or scan the merchant QR.');
      return;
    }
    if (!merchantId.trim()) {
      setFormError('Merchant ID (MID) is required.');
      return;
    }
    if (currentActivityObj.requiresReason && !reason.trim()) {
      setFormError('Please specify the Reason or Details for this activity.');
      return;
    }

    setIsSubmitting(true);
    const taskId = `TASK-${Date.now().toString().slice(-6)}`;
    const mapsUrl = latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : undefined;

    const newTask: TaskRecord = {
      id: taskId,
      submittedAt: new Date().toISOString(),
      submittedBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        role: currentUser.role
      },
      category,
      activityId: currentActivityObj.id,
      activityLabel: currentActivityObj.label,
      merchantName: merchantName.trim(),
      merchantId: merchantId.trim(),
      terminalId: terminalId.trim() || undefined,
      phoneNumber: phoneNumber.trim(),
      businessType,
      location: {
        latitude,
        longitude,
        address: address.trim() || undefined,
        mapsUrl
      },
      businessHours: {
        openTime,
        closeTime,
        is24Hours
      },
      deviceSerialNumber: deviceSerialNumber.trim() || undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim(),
      images,
      telegramStatus: 'pending',
      sheetsStatus: 'pending'
    };

    try {
      // Step 1: Save locally
      setSubmitProgress('Saving to local database...');
      
      // Step 2: Sync to Google Sheets (except images as per requirements)
      setSubmitProgress('Syncing record to Google Sheets...');
      const sheetsResult = await syncTaskToGoogleSheets(newTask, settings);
      newTask.sheetsStatus = sheetsResult.success ? 'synced' : 'failed';
      newTask.sheetsError = sheetsResult.error;

      // Step 3: Send to Telegram Bot (including images)
      setSubmitProgress(images.length > 0 
        ? `Sending formatted report & ${images.length} photos to Telegram...`
        : 'Sending alert to Telegram Group...'
      );
      const telegramResult = await sendTaskToTelegram(newTask, settings);
      newTask.telegramStatus = telegramResult.success ? 'sent' : 'failed';
      newTask.telegramError = telegramResult.error;
      newTask.telegramMessageId = telegramResult.messageId;

      // Finalize record persistence
      addTaskRecord(newTask);
      onTaskCreated(newTask);
      setLastSubmittedTask(newTask);

      // Reset form
      setMerchantName('');
      setMerchantId('');
      setTerminalId('');
      setPhoneNumber('');
      setReason('');
      setNotes('');
      setDeviceSerialNumber('');
      setImages([]);
      setAddress('');
      setLatitude(undefined);
      setLongitude(undefined);
      setLocationSuccess(false);

    } catch (err: unknown) {
      console.error(err);
      setFormError(`Submission error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Notification Banner */}
      {lastSubmittedTask && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs animate-in fade-in space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  Task Successfully Recorded! ({lastSubmittedTask.id})
                </h3>
                <p className="text-xs text-emerald-700">
                  Logged for <b>{lastSubmittedTask.merchantName}</b> by {lastSubmittedTask.submittedBy.userName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastSubmittedTask(null)}
              className="text-xs text-emerald-600 hover:underline"
            >
              Dismiss
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Google Sheets: {lastSubmittedTask.sheetsStatus === 'synced' ? 'Synced (No images)' : 'Logged locally'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Telegram: {lastSubmittedTask.telegramStatus === 'sent' ? `Sent (+${lastSubmittedTask.images.length} photos)` : 'Logged locally'}
            </span>
            <button
              type="button"
              onClick={onViewSubmissions}
              className="ml-auto inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline"
            >
              View in My Tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-blue-500/40 text-blue-100 rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
              Field Agent Logging
            </span>
            <h2 className="text-xl font-bold tracking-tight">Record Field Activity</h2>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Syncs to Google Sheets & dispatches live alerts with photos to Telegram Group
            </p>
          </div>

          <div className="flex items-center gap-2 bg-blue-900/50 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-blue-400/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Agent: <b>{currentUser.name}</b></span>
          </div>
        </div>

        {formError && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-medium">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* SECTION 1: CATEGORY & ACTIVITY */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Select Task Category & Activity
            </label>

            {/* Category Pill Switcher */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange('merchant_visit')}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-semibold text-sm border transition-all ${
                  category === 'merchant_visit'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Merchant Visit (10 Tasks)
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('pos_soundbox')}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-semibold text-sm border transition-all ${
                  category === 'pos_soundbox'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                POS & Soundbox Work (14 Tasks)
              </button>
            </div>

            {/* Activity Type Dropdown */}
            <div>
              <label htmlFor="activity-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specific Activity Type <span className="text-red-500">*</span>
              </label>
              <select
                id="activity-select"
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                {currentCategoryActivities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.label}
                  </option>
                ))}
              </select>
              {currentActivityObj.description && (
                <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {currentActivityObj.description}
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200"></div>

          {/* SECTION 2: MERCHANT DETAILS & QR SCANNER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Merchant Information
              </label>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
              >
                <QrCode className="w-3.5 h-3.5" />
                Scan Merchant QR Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brown Coffee Roastery"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant ID (MID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. KHQR0098231"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terminal ID (TID) <span className="text-slate-400 font-normal">(Optional / POS)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TID-0045"
                  value={terminalId}
                  onChange={(e) => setTerminalId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="e.g. +855 12 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  {BUSINESS_TYPES.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200"></div>

          {/* SECTION 3: LOCATION & BUSINESS HOURS */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Business Location & Operating Hours
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Input & GPS Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Location / Address</span>
                  <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    {isLocating ? 'Detecting GPS...' : 'Use Current Location'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter street address, market name or landmark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {locationSuccess && latitude && longitude && (
                  <div className="flex items-center justify-between text-[11px] bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <span>GPS Acquired: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                    <a
                      href={`https://maps.google.com/?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Preview Map
                    </a>
                  </div>
                )}
              </div>

              {/* Operating Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Business Hours</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={is24Hours}
                      onChange={(e) => setIs24Hours(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Open 24 Hours</span>
                  </label>
                </div>

                {!is24Hours ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Open Time</span>
                      <div className="relative">
                        <input
                          type="time"
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Close Time</span>
                      <div className="relative">
                        <input
                          type="time"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Store operates 24 hours non-stop
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200"></div>

          {/* SECTION 4: HARDWARE / REASON / DETAILS */}
          {(currentActivityObj.requiresDeviceSN || currentActivityObj.requiresReason || category === 'pos_soundbox') && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Hardware & Case Details
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(currentActivityObj.requiresDeviceSN || category === 'pos_soundbox') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Device Serial Number (S/N)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PAX-A920-8849201 or SBOX-7729"
                      value={deviceSerialNumber}
                      onChange={(e) => setDeviceSerialNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                )}

                {currentActivityObj.requiresReason && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason / Cause / Competitor Benefit Details <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Competitor provided free soundbox & 0% fee / Merchant only accepts cash / App crashing on Android 14"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: IMAGES & ATTACHMENTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  5. Photo Proof / Multiple Images
                </label>
                <p className="text-xs text-slate-500">
                  Browse from gallery (QR stickers, POS placement, storefront, sign sheet). Sent to Telegram.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {images.length}/8 Photos
              </span>
            </div>

            {/* Image Upload Button & Previews */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-2xs">
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full opacity-90 transition-opacity shadow-xs"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[10px] px-1.5 py-0.5 truncate text-center">
                    {(img.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              ))}

              {images.length < 8 && (
                <label className={`relative aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors ${isProcessingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Camera className="w-6 h-6 text-blue-600 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Browse Gallery</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Multi-select photos</span>
                </label>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200"></div>

          {/* SECTION 6: ADDITIONAL NOTES */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              6. Additional Notes & Remarks
            </label>
            <textarea
              rows={3}
              placeholder="Enter any feedback, observations, replacement notes, or follow-up actions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Submission Action Bar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImages}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{submitProgress || 'Submitting Activity Log...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Task & Dispatch to Telegram & Google Sheets</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Google Sheets receives all data fields. Telegram receives formatted report + all attached photos.
            </p>
          </div>
        </div>
      </form>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onScanComplete={handleQRComplete}
      />
    </div>
  );
};
