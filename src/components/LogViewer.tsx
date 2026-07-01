import { useState } from 'react';
import { ScrollText, Search, Trash2, Clock, User, Info } from 'lucide-react';
import { SystemLog } from '../types';

interface LogViewerProps {
  logs: SystemLog[];
  onClearLogs: () => void;
}

export default function LogViewer({ logs, onClearLogs }: LogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  // Filter logs based on search and action filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleClearClick = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat aktivitas? Tindakan ini tidak dapat dibatalkan.")) {
      onClearLogs();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-slate-100 text-slate-800 rounded-lg">📜</span>
            Log Aktivitas Sistem
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pantau semua aktivitas perubahan data, pengisian nilai, dan pengaturan sistem untuk audit keamanan.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={handleClearClick}
            className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl border border-red-200 transition active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
          >
            <Trash2 size={14} />
            <span>Kosongkan Log</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan detail atau operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-gray-750 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Jenis Aktivitas</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs List Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ScrollText size={36} className="mx-auto text-slate-300 animate-pulse" />
            <p className="font-bold text-sm">Tidak Ada Log Aktivitas</p>
            <p className="text-xs">Belum ada aktivitas yang terekam atau filter tidak cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="p-4 font-bold w-48">Waktu & Tanggal</th>
                  <th className="p-4 font-bold w-44">Jenis Aktivitas</th>
                  <th className="p-4 font-bold">Detail Perubahan</th>
                  <th className="p-4 font-bold w-36">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  let actionBadgeColor = "bg-slate-100 text-slate-800 border-slate-200";
                  if (log.action.includes("Tambah")) {
                    actionBadgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                  } else if (log.action.includes("Ubah") || log.action.includes("Edit") || log.action.includes("Atur")) {
                    actionBadgeColor = "bg-blue-50 text-blue-800 border-blue-200";
                  } else if (log.action.includes("Hapus") || log.action.includes("Kosongkan")) {
                    actionBadgeColor = "bg-red-50 text-red-800 border-red-200";
                  } else if (log.action.includes("Backup") || log.action.includes("Restore")) {
                    actionBadgeColor = "bg-purple-50 text-purple-800 border-purple-200";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          {formatDate(log.timestamp)}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs">
                        <span className={`px-2.5 py-1 border rounded-md font-bold ${actionBadgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700">
                        <span className="flex items-start gap-2">
                          <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{log.details}</span>
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-500" />
                          {log.user}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
