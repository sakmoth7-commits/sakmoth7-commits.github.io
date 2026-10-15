import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  Calendar, 
  MapPin, 
  Layers, 
  Building2, 
  Image as ImageIcon,
  CheckCircle,
  Clock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { TaskRecord, UserProfile, ActivityCategory, BusinessType, AppSettings } from '../types';
import { exportTasksToExcel, openPrintablePDFView } from '../utils/exportService';
import { TaskDetailModal } from './TaskDetailModal';

interface SubmissionsListProps {
  tasks: TaskRecord[];
  currentUser: UserProfile;
  settings: AppSettings;
  onTaskUpdated?: (updatedTask: TaskRecord) => void;
  forcedFilterUserOnly?: boolean;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  tasks,
  currentUser,
  settings,
  onTaskUpdated,
  forcedFilterUserOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActivityCategory>('all');
  const [onlyMyTasks, setOnlyMyTasks] = useState(forcedFilterUserOnly || currentUser.role === 'user');
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. My tasks filter
      if (onlyMyTasks && task.submittedBy.userId !== currentUser.id) {
        return false;
      }

      // 2. Category filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // 3. Date filter
      if (dateFilter !== 'all') {
        const taskDate = new Date(task.submittedAt).getTime();
        const now = Date.now();
        if (dateFilter === 'today' && now - taskDate > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === 'week' && now - taskDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === 'month' && now - taskDate > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // 4. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesMerchant = task.merchantName.toLowerCase().includes(term);
        const matchesMid = task.merchantId?.toLowerCase().includes(term);
        const matchesTid = task.terminalId?.toLowerCase().includes(term);
        const matchesActivity = task.activityLabel.toLowerCase().includes(term);
        const matchesAgent = task.submittedBy.userName.toLowerCase().includes(term);
        const matchesNotes = task.notes?.toLowerCase().includes(term);
        const matchesSn = task.deviceSerialNumber?.toLowerCase().includes(term);
        
        return matchesMerchant || matchesMid || matchesTid || matchesActivity || matchesAgent || matchesNotes || matchesSn;
      }

      return true;
    });
  }, [tasks, onlyMyTasks, currentUser.id, categoryFilter, dateFilter, searchTerm]);

  const handleExportExcel = () => {
    const filename = onlyMyTasks ? `My_Field_Activities_${currentUser.name.replace(/\s+/g, '_')}` : 'Team_Field_Activities';
    exportTasksToExcel(filteredTasks, filename);
  };

  const handleExportPDF = () => {
    const title = onlyMyTasks ? `Personal Field Activity Log - ${currentUser.name}` : 'Field Operations Comprehensive Activity Report';
    openPrintablePDFView(filteredTasks, title);
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {onlyMyTasks ? 'My Field Activity Log' : 'Team Activities & Submissions'}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredTasks.length} of {tasks.length} recorded tasks
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              title="Download formatted Excel workbook"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search merchant, MID, TID, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="merchant_visit">Merchant Visit Only</option>
              <option value="pos_soundbox">POS & Soundbox Only</option>
            </select>
          </div>

          {/* Date range filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today (Past 24h)</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          {/* User scope toggle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOnlyMyTasks(!onlyMyTasks)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                onlyMyTasks
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{onlyMyTasks ? 'Showing: My Tasks Only' : 'Showing: All Team Members'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700 text-sm">No activity records match your filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, category dropdown, or switch to view all team tasks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Merchant & MID</th>
                  <th className="py-3.5 px-4">Activity Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Agent / Date</th>
                  <th className="py-3.5 px-4">Sync Status</th>
                  <th className="py-3.5 px-4 text-center">Photos</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const isPos = task.category === 'pos_soundbox';
                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-sm">
                          {task.merchantName || 'Unnamed Merchant'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-500">
                          <span>MID: {task.merchantId || '—'}</span>
                          {task.terminalId && (
                            <span className="text-indigo-600 font-semibold">• TID: {task.terminalId}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {task.businessType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 leading-snug line-clamp-2">
                          {task.activityLabel}
                        </div>
                        {task.reason && (
                          <div className="text-[11px] text-amber-700 font-medium mt-1 truncate">
                            ⚠️ {task.reason}
                          </div>
                        )}
                        {task.notes && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            "{task.notes}"
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          isPos
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {isPos ? <Layers className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {isPos ? 'POS / Soundbox' : 'Merchant Visit'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">
                          {task.submittedBy.userName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(task.submittedAt).toLocaleDateString()} {new Date(task.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className={`inline-flex items-center gap-1 font-medium ${
                            task.sheetsStatus === 'synced' ? 'text-emerald-700' : 'text-slate-400'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Sheets: {task.sheetsStatus === 'synced' ? 'Synced' : 'Saved'}
                          </span>
                          <span className={`inline-flex items-center gap-1 font-medium ${
                            task.telegramStatus === 'sent' ? 'text-blue-700' : 'text-slate-400'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Telegram: {task.telegramStatus === 'sent' ? 'Sent' : 'Saved'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {task.images && task.images.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                            {task.images.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          settings={settings}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => {
            setSelectedTask(updated);
            if (onTaskUpdated) onTaskUpdated(updated);
          }}
        />
      )}
    </div>
  );
};
