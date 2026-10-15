import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  ListFilter, 
  BarChart3, 
  Settings as SettingsIcon, 
  Shield, 
  UserCheck, 
  Send, 
  FileSpreadsheet,
  Layers,
  ChevronDown
} from 'lucide-react';
import { UserProfile, UserRole, AppSettings } from '../types';
import { PRESET_USERS } from '../data/activityCatalog';

interface NavbarProps {
  currentView: 'form' | 'my_submissions' | 'all_submissions' | 'dashboard';
  onNavigate: (view: 'form' | 'my_submissions' | 'all_submissions' | 'dashboard') => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  taskCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onUserChange,
  onOpenSettings,
  settings,
  taskCount
}) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigate(isAdmin ? 'dashboard' : 'form')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Merchant<span className="text-blue-600">Ops</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 tracking-wider">
                  Field Force
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('form')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                currentView === 'form'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Activity</span>
            </button>

            <button
              onClick={() => onNavigate('my_submissions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                currentView === 'my_submissions'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Tasks</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-blue-50 text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </button>

                <button
                  onClick={() => onNavigate('all_submissions')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentView === 'all_submissions'
                      ? 'bg-blue-50 text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>Team Tasks ({taskCount})</span>
                </button>
              </>
            )}
          </nav>

          {/* User Role Switcher & Integrations Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Integration indicators */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold text-slate-500 mr-1">
              <span 
                onClick={onOpenSettings} 
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                  settings.telegramBotToken && settings.telegramChatId 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                title="Telegram Bot Integration"
              >
                <Send className="w-3 h-3 text-blue-500" />
                <span>{settings.telegramBotToken ? 'Bot Connected' : 'Config Bot'}</span>
              </span>

              <span 
                onClick={onOpenSettings} 
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                  settings.googleSheetsWebhookUrl 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                title="Google Sheets Auto-Sync"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                <span>{settings.googleSheetsWebhookUrl ? 'Sheets Synced' : 'Config Sheets'}</span>
              </span>
            </div>

            {/* Quick Role & Profile Switcher Dropdown */}
            <div className="relative">
              <select
                aria-label="Active Account & Role Switcher"
                value={currentUser.id}
                onChange={(e) => {
                  const found = PRESET_USERS.find(u => u.id === e.target.value);
                  if (found) {
                    onUserChange(found);
                    if (found.role === 'admin' && currentView === 'my_submissions') {
                      onNavigate('dashboard');
                    }
                  }
                }}
                className={`appearance-none pl-8 pr-7 py-1.5 rounded-xl text-xs font-bold cursor-pointer border shadow-2xs focus:outline-none transition-all ${
                  isAdmin 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {PRESET_USERS.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'admin' ? `🛡️ [Admin] ${u.name}` : `👤 [Agent] ${u.name}`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                {isAdmin ? <Shield className="w-3.5 h-3.5 text-indigo-600" /> : <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Settings & Integrations"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('form')}
            className={`py-1 px-2.5 rounded-lg ${currentView === 'form' ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}
          >
            New Task
          </button>
          <button
            onClick={() => onNavigate('my_submissions')}
            className={`py-1 px-2.5 rounded-lg ${currentView === 'my_submissions' ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}
          >
            My Tasks
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`py-1 px-2.5 rounded-lg ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('all_submissions')}
                className={`py-1 px-2.5 rounded-lg ${currentView === 'all_submissions' ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}
              >
                Team Tasks
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
