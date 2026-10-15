import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TaskForm } from './components/TaskForm';
import { SubmissionsList } from './components/SubmissionsList';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskRecord, UserProfile, AppSettings } from './types';
import { 
  getStoredTasks, 
  getStoredSettings, 
  getActiveUser, 
  setActiveUser, 
  saveStoredTasks,
  DEFAULT_SETTINGS 
} from './utils/storage';
import { PRESET_USERS } from './data/activityCatalog';
import { Shield, Sparkles, Send, FileSpreadsheet, Github } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUserState] = useState<UserProfile>(PRESET_USERS[0]);
  const [currentView, setCurrentView] = useState<'form' | 'my_submissions' | 'all_submissions' | 'dashboard'>('form');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskRecord | null>(null);

  // Initialize from storage
  useEffect(() => {
    const loadedTasks = getStoredTasks();
    setTasks(loadedTasks);

    const loadedSettings = getStoredSettings();
    setSettings(loadedSettings);

    const activeUser = getActiveUser();
    setCurrentUserState(activeUser);

    if (activeUser.role === 'admin') {
      setCurrentView('dashboard');
    }
  }, []);

  const handleUserChange = (user: UserProfile) => {
    setCurrentUserState(user);
    setActiveUser(user);
    if (user.role === 'admin') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('form');
    }
  };

  const handleTaskCreated = (newTask: TaskRecord) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: TaskRecord) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      saveStoredTasks(next);
      return next;
    });
  };

  const handleSettingsSaved = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        taskCount={tasks.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Role Helper Banner */}
        <div className="mb-6 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg font-bold uppercase text-[10px] tracking-wider ${
              currentUser.role === 'admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {currentUser.role === 'admin' ? 'Role: Administrator' : 'Role: Field User'}
            </span>
            <span className="text-slate-600">
              Active User: <b>{currentUser.name}</b> ({currentUser.email})
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span className="hidden sm:inline">
              {currentUser.role === 'admin'
                ? '✨ Admin privileges: Full Dashboard overview, analytics, & enterprise Excel/PDF export.'
                : '✨ User privileges: Form entry with QR decoder, photo uploads to Telegram, and personal exports.'
              }
            </span>
            <button
              onClick={() => {
                const target = currentUser.role === 'admin' ? PRESET_USERS[0] : PRESET_USERS[3];
                handleUserChange(target);
              }}
              className="text-blue-600 font-bold hover:underline shrink-0"
            >
              Switch to {currentUser.role === 'admin' ? 'Field Agent Role' : 'Admin Role'}
            </button>
          </div>
        </div>

        {/* Dynamic View Display */}
        {currentView === 'form' && (
          <TaskForm
            currentUser={currentUser}
            settings={settings}
            onTaskCreated={handleTaskCreated}
            onViewSubmissions={() => setCurrentView('my_submissions')}
          />
        )}

        {currentView === 'my_submissions' && (
          <SubmissionsList
            tasks={tasks}
            currentUser={currentUser}
            settings={settings}
            onTaskUpdated={handleTaskUpdated}
            forcedFilterUserOnly={currentUser.role === 'user'}
          />
        )}

        {currentView === 'all_submissions' && (
          <SubmissionsList
            tasks={tasks}
            currentUser={currentUser}
            settings={settings}
            onTaskUpdated={handleTaskUpdated}
            forcedFilterUserOnly={false}
          />
        )}

        {currentView === 'dashboard' && (
          <AdminDashboard
            tasks={tasks}
            settings={settings}
            onNavigateToSubmissions={() => setCurrentView('all_submissions')}
            onViewTask={(task) => setSelectedTaskDetail(task)}
          />
        )}
      </main>

      {/* Global Settings & Integrations Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsSaved={handleSettingsSaved}
      />

      {/* Task Detail Modal */}
      {selectedTaskDetail && (
        <TaskDetailModal
          task={selectedTaskDetail}
          settings={settings}
          onClose={() => setSelectedTaskDetail(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MerchantOps</span>
            <span>• Field Force Activity & Merchant Management System</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-600">
              <Github className="w-3.5 h-3.5" /> Static GitHub Hosting Compatible
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-blue-600 hover:underline font-semibold"
            >
              Configure Telegram & Sheets
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
