import React, { useState } from 'react';
import { 
  X, 
  Send, 
  FileSpreadsheet, 
  Github, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  Save, 
  RefreshCw,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { AppSettings } from '../types';
import { saveStoredSettings } from '../utils/storage';
import { testTelegramBot } from '../utils/telegramService';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/sheetsService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsSaved: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsSaved
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'sheets' | 'github'>('telegram');
  const [formSettings, setFormSettings] = useState<AppSettings>({ ...settings });
  
  // Telegram test state
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Script copied state
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredSettings(formSettings);
    onSettingsSaved(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestTelegram = async () => {
    if (!formSettings.telegramBotToken || !formSettings.telegramChatId) {
      setTelegramTestResult({
        ok: false,
        message: 'Please enter both Bot Token and Chat ID first.'
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestResult(null);

    const result = await testTelegramBot(formSettings.telegramBotToken, formSettings.telegramChatId);
    setIsTestingTelegram(false);
    setTelegramTestResult(result);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">System Integrations & Hosting</h2>
              <p className="text-xs text-slate-500">Telegram Bot, Google Sheets Webhook, and GitHub Deployment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'telegram'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Bot</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'github'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Hosting</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* TAB 1: TELEGRAM BOT */}
          {activeTab === 'telegram' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                When a field agent submits a task, this bot posts the full formatted activity report plus <b>all attached photos</b> directly into your Telegram Group.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telegram Bot Token
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 7123456789:AAHk..."
                    value={formSettings.telegramBotToken}
                    onChange={(e) => setFormSettings({ ...formSettings, telegramBotToken: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Obtained from <b>@BotFather</b> on Telegram via <code>/newbot</code>
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telegram Chat ID or Group ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. -1001928374650 or @MyFieldTeamGroup"
                    value={formSettings.telegramChatId}
                    onChange={(e) => setFormSettings({ ...formSettings, telegramChatId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Group IDs typically start with <code>-100</code>. Add bot as admin to the group.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingTelegram ? 'animate-spin' : ''}`} />
                    <span>{isTestingTelegram ? 'Testing Connection...' : 'Test Bot Connection'}</span>
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formSettings.telegramEnabled}
                      onChange={(e) => setFormSettings({ ...formSettings, telegramEnabled: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Enable Telegram Alerts</span>
                  </label>
                </div>

                {telegramTestResult && (
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    telegramTestResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    {telegramTestResult.ok ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{telegramTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* How-to guide */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-slate-500 text-[11px]">
                <div className="font-bold text-slate-700">Quick 2-minute setup:</div>
                <div>1. Message <b>@BotFather</b> on Telegram &gt; type <code>/newbot</code> &gt; copy API token.</div>
                <div>2. Add your bot into your Telegram group &gt; promote as Admin (Can post messages).</div>
                <div>3. Add <b>@userinfobot</b> to your group or forward a message to get your group chat ID (e.g. <code>-100...</code>).</div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 leading-relaxed">
                As required, <b>all task information is recorded in Google Sheets except images</b> (photos are delivered to Telegram to prevent spreadsheet clutter).
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Google Apps Script Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={formSettings.googleSheetsWebhookUrl}
                    onChange={(e) => setFormSettings({ ...formSettings, googleSheetsWebhookUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formSettings.googleSheetsEnabled}
                      onChange={(e) => setFormSettings({ ...formSettings, googleSheetsEnabled: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Enable Auto-Sync to Google Sheets</span>
                  </label>
                </div>
              </div>

              {/* Copy Script Snippet */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200">
                <div className="px-4 py-2 bg-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span>Google Apps Script (Code.gs)</span>
                  <button
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Apps Script'}</span>
                  </button>
                </div>
                <pre className="p-3 text-[10px] font-mono overflow-x-auto max-h-40 leading-relaxed text-slate-300">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">How to deploy Google Sheet in 1 minute:</div>
                <div>1. In Google Sheets, click <b>Extensions &gt; Apps Script</b>.</div>
                <div>2. Click "Copy Apps Script" above and paste into <code>Code.gs</code>.</div>
                <div>3. Click <b>Deploy &gt; New deployment &gt; Web app</b>. Set access to <b>Anyone</b>.</div>
                <div>4. Copy the Web app URL and paste into the box above.</div>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB HOSTING */}
          {activeTab === 'github' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 font-medium">
                <Github className="w-4 h-4 text-slate-800 shrink-0" />
                <span>This application is built 100% client-side and is ready for GitHub Pages hosting.</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Deployment Steps to GitHub Pages:</h4>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                  <div># 1. Initialize git and link to your GitHub repo</div>
                  <div className="text-emerald-400">git init</div>
                  <div className="text-emerald-400">git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git</div>
                  <br />
                  <div># 2. Build the production static assets</div>
                  <div className="text-emerald-400">npm run build</div>
                  <br />
                  <div># 3. Publish the 'dist' folder to gh-pages branch</div>
                  <div className="text-emerald-400">npx gh-pages -d dist</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <div className="font-bold">Why this works seamlessly on GitHub Pages:</div>
                <div>• All QR parsing runs in-browser via JavaScript canvas.</div>
                <div>• Telegram Bot API requests are dispatched directly via HTTPS.</div>
                <div>• Google Sheets logging posts to your Google Apps Script Webhook.</div>
                <div>• Excel (.xlsx) and PDF reports are generated entirely client-side.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Settings saved successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
