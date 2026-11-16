import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Filter, Clock, User, ArrowRight, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const AuditLogTable = ({ token, currentLanguage = 'en' }) => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalLogs: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      let url = `/api/v1/crm/audit-logs?page=${page}&limit=${pagination.limit}`;
      if (actionFilter) {
        url += `&action=${actionFilter}`;
      }

      const res = await fetch(getApiUrl(url), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setLogs(json.data.logs || []);
        setPagination(json.data.pagination || { page: 1, limit: 15, totalLogs: 0, totalPages: 1 });
      } else {
        setError(json.error?.message || 'Failed to retrieve audit logs');
      }
    } catch (err) {
      setError('Network error while retrieving audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const getActionBadge = (act) => {
    switch (act) {
      case 'LEAD_ASSIGNED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'STATUS_CHANGED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'NOTE_ADDED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-navy-900 border border-navy-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Immutable Institutional Audit Ledger</h3>
            <p className="text-[11px] text-slate-400">Append-only chronological record of all administrative actions & transitions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-navy-950 border border-navy-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs"
            >
              <option value="">All Actions</option>
              <option value="LEAD_ASSIGNED">Lead Assigned</option>
              <option value="STATUS_CHANGED">Status Changed</option>
              <option value="NOTE_ADDED">Note Added</option>
            </select>
          </div>

          <button
            onClick={() => fetchLogs(pagination.page)}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Table (Desktop/Tablet) */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy-950/80 border-b border-navy-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Value Transition</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="inline-block w-5 h-5 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Loading audit entries...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records found matching this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.actorName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.actorRole}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {log.entityType} ({String(log.entityId).slice(-6)})
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        {log.previousValue !== null && log.previousValue !== undefined ? (
                          <span className="text-slate-400 line-through text-[11px]">{String(log.previousValue)}</span>
                        ) : null}
                        {log.previousValue && log.newValue && <ArrowRight className="w-3 h-3 text-slate-500" />}
                        <span className="font-bold text-emerald-400">
                          {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue || '-')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                      {log.metadata?.reason && <span className="italic">"{log.metadata.reason}"</span>}
                      {log.metadata?.counsellorName && <span>Assigned: {log.metadata.counsellorName}</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Audit Cards (< 768px) */}
        <div className="md:hidden divide-y divide-navy-800/80">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400">
              <span className="inline-block w-5 h-5 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading audit entries...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              No audit records found matching this filter.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({log.actorRole})</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-300">
                    {log.entityType} #{String(log.entityId).slice(-6)}
                  </span>
                </div>

                <div className="text-[11px] bg-navy-950 p-2 rounded-lg border border-navy-800 flex items-center gap-1.5">
                  {log.previousValue !== null && log.previousValue !== undefined ? (
                    <span className="text-slate-400 line-through">{String(log.previousValue)}</span>
                  ) : null}
                  {log.previousValue && log.newValue && <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />}
                  <span className="font-bold text-emerald-400">
                    {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue || '-')}
                  </span>
                </div>

                {log.metadata?.reason && (
                  <p className="text-[10px] italic text-slate-400">Reason: "{log.metadata.reason}"</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-navy-950/80 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Total: <strong className="text-white">{pagination.totalLogs}</strong> audit entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-navy-800 text-slate-300 disabled:opacity-40 hover:bg-navy-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-navy-800 text-slate-300 disabled:opacity-40 hover:bg-navy-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
