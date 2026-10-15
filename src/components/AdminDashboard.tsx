import React from 'react';
import { 
  BarChart3, 
  Building2, 
  Layers, 
  Users, 
  FileSpreadsheet, 
  Printer, 
  ArrowUpRight, 
  CheckCircle, 
  AlertTriangle, 
  Store, 
  Smartphone,
  TrendingUp,
  Clock
} from 'lucide-react';
import { TaskRecord, AppSettings } from '../types';
import { exportTasksToExcel, openPrintablePDFView } from '../utils/exportService';

interface AdminDashboardProps {
  tasks: TaskRecord[];
  settings: AppSettings;
  onNavigateToSubmissions: () => void;
  onViewTask: (task: TaskRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tasks,
  settings,
  onNavigateToSubmissions,
  onViewTask
}) => {
  const totalTasks = tasks.length;
  const merchantVisits = tasks.filter(t => t.category === 'merchant_visit');
  const posSoundboxTasks = tasks.filter(t => t.category === 'pos_soundbox');
  
  // Agent Performance mapping
  const agentStats: Record<string, { count: number; name: string; email: string }> = {};
  tasks.forEach(t => {
    const id = t.submittedBy.userId;
    if (!agentStats[id]) {
      agentStats[id] = { count: 0, name: t.submittedBy.userName, email: t.submittedBy.userEmail };
    }
    agentStats[id].count += 1;
  });

  // Top Activities breakdown
  const activityCount: Record<string, number> = {};
  tasks.forEach(t => {
    activityCount[t.activityLabel] = (activityCount[t.activityLabel] || 0) + 1;
  });
  const topActivities = Object.entries(activityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Business Types breakdown
  const businessTypeCount: Record<string, number> = {};
  tasks.forEach(t => {
    businessTypeCount[t.businessType] = (businessTypeCount[t.businessType] || 0) + 1;
  });
  const sortedBusinessTypes = Object.entries(businessTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Issues / Reasons flagged
  const issuesList = tasks.filter(t => t.reason || t.activityId.includes('refuse') || t.activityId.includes('competitor') || t.activityId.includes('cannot-open') || t.activityId.includes('issue'));

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-block px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              Executive Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Field Operations Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Live intelligence from merchant visits, POS terminal installs, soundbox deployments, and field sync status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportTasksToExcel(tasks, 'Enterprise_Field_Operations_Report')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Full Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => openPrintablePDFView(tasks, 'Executive Field Activity Report')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Activities
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {totalTasks}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> 100% Recorded in System
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Merchant Visits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Merchant Visits
            </span>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">
              {merchantVisits.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {totalTasks > 0 ? `${((merchantVisits.length / totalTasks) * 100).toFixed(0)}% of total operations` : '0%'}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* POS & Soundbox */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              POS & Soundbox
            </span>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">
              {posSoundboxTasks.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Hardware & maintenance
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Field Agents Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Field Agents
            </span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">
              {Object.keys(agentStats).length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Logged team officers
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Activities Breakdown (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Top Field Activities Performed</h3>
              <p className="text-xs text-slate-500">Distribution of merchant visits and hardware deployment</p>
            </div>
            <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline" onClick={onNavigateToSubmissions}>
              View All Tasks &rarr;
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {topActivities.map(([label, count]) => {
              const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate pr-4">{label}</span>
                    <span className="text-slate-900 font-bold shrink-0">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Agent Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Officer Submissions</h3>
          <p className="text-xs text-slate-500">Tasks logged by each field agent</p>

          <div className="space-y-3 pt-1">
            {Object.values(agentStats).map((stat) => (
              <div key={stat.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800 text-xs">{stat.name}</div>
                  <div className="text-[10px] text-slate-400">{stat.email}</div>
                </div>
                <span className="px-2.5 py-1 bg-white font-bold text-blue-700 rounded-lg border border-slate-200 text-xs shadow-2xs">
                  {stat.count} logs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Merchant Industry & Issue Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Business Types */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Merchant Business Types</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {sortedBusinessTypes.map(([type, count]) => (
              <div key={type} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block truncate">{type}</span>
                <span className="text-lg font-bold text-slate-800">{count} merchants</span>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor & Merchant Objections Watchlist */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Competitor & Objections Watchlist</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{issuesList.length} cases</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {issuesList.slice(0, 4).map(item => (
              <div 
                key={item.id} 
                onClick={() => onViewTask(item)}
                className="p-3 bg-amber-50/60 hover:bg-amber-100/60 rounded-xl border border-amber-200/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-950 truncate">{item.merchantName}</span>
                  <span className="text-[10px] text-amber-700">{new Date(item.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="text-[11px] text-amber-900 mt-1 line-clamp-1">
                  {item.reason || item.activityLabel}
                </div>
              </div>
            ))}
            {issuesList.length === 0 && (
              <div className="text-xs text-slate-400 py-6 text-center">
                No merchant objections or competitor alerts recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
