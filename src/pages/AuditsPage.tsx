import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  ScanSearch,
  Search,
  Trash2,
} from 'lucide-react';
import { AuditReportCard, getRiskTextMeta } from '../components/AuditReportCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { auditsApi, extractApiError } from '../services/api';
import {
  RISK_LEVELS,
  TRUST_CATEGORIES,
  type AuditRecord,
} from '../shared/schemas';
import { exportAuditsAsCsv, exportAuditsAsJson } from '../utils/exportUtils';

export function AuditsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<AuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isolationScope, setIsolationScope] = useState<
    'organization' | 'personal'
  >('personal');

  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditsApi.list({
        page,
        limit: 8,
        riskLevel: riskFilter,
        category: categoryFilter,
        search: debouncedSearch,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setIsolationScope(res.isolationScope);

      const requestedId = searchParams.get('selected');
      if (requestedId) {
        const matchInPage = res.items.find((a) => a.id === requestedId);
        if (matchInPage) {
          setSelectedAudit(matchInPage);
        } else {
          try {
            const fetched = await auditsApi.getById(requestedId);
            setSelectedAudit(fetched);
          } catch {
            if (res.items.length > 0) setSelectedAudit(res.items[0]);
          }
        }
      } else if (res.items.length > 0) {
        setSelectedAudit((prev) =>
          prev && res.items.some((a) => a.id === prev.id) ? prev : res.items[0]
        );
      } else {
        setSelectedAudit(null);
      }
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Failed to load audit history',
        description: extractApiError(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, riskFilter, categoryFilter, debouncedSearch, searchParams, notify]);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const handleBulkExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const allFiltered = await auditsApi.exportAll({
        riskLevel: riskFilter,
        category: categoryFilter,
        search: debouncedSearch,
      });
      if (allFiltered.length === 0) {
        notify({
          variant: 'info',
          title: 'Nothing to export',
          description: 'No audit records match your active filters.',
        });
        return;
      }
      if (format === 'csv') {
        exportAuditsAsCsv(allFiltered, 'ai-security-audit-log');
      } else {
        exportAuditsAsJson(allFiltered, 'ai-security-audit-log');
      }
      notify({
        variant: 'success',
        title: `Exported ${allFiltered.length} audit record(s)`,
        description: `Downloaded ${format.toUpperCase()} compliance archive.`,
      });
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Export failed',
        description: extractApiError(err),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAudit = async (auditId: string) => {
    try {
      await auditsApi.remove(auditId);
      setConfirmDeleteId(null);
      if (searchParams.get('selected') === auditId) {
        searchParams.delete('selected');
        setSearchParams(searchParams, { replace: true });
      }
      notify({
        variant: 'success',
        title: 'Audit record deleted',
      });
      loadAudits();
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Unable to delete audit',
        description: extractApiError(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Bulk Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Security Audit History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isolationScope === 'organization'
              ? `Organization-wide audit log (${total} total records visible to ${user?.role}).`
              : `Row-level isolated personal audit log (${total} records owned by ${user?.fullName}).`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={exporting || total === 0}
            onClick={() => handleBulkExport('json')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            disabled={exporting || total === 0}
            onClick={() => handleBulkExport('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Paginated Table */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Risk Level Segmented Filter */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['ALL', ...RISK_LEVELS] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setRiskFilter(lvl);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    riskFilter === lvl
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl === 'ALL' ? 'All Risk Levels' : lvl}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Trust Category Dropdown */}
              <select
                aria-label="Filter by trust domain"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Trust Domains</option>
                {TRUST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search prompt, summary, or user..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-10 bg-slate-100 rounded animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No security audits match current filters
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Clear active filters or initiate a new prompt evaluation in the
              scanner.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              {(riskFilter !== 'ALL' ||
                categoryFilter !== 'ALL' ||
                searchInput.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setRiskFilter('ALL');
                    setCategoryFilter('ALL');
                    setSearchInput('');
                    setPage(1);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/scanner')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                <span>Open Scanner</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4">Evaluated Prompt &amp; Submitter</th>
                  <th className="py-3 px-4 whitespace-nowrap">Model</th>
                  <th className="py-3 px-4 whitespace-nowrap">Risk</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Score
                  </th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {items.map((audit) => {
                  const riskMeta = getRiskTextMeta(audit.riskLevel);
                  const RiskIcon = riskMeta.Icon;
                  const isSelected = selectedAudit?.id === audit.id;
                  const canDelete =
                    user?.role === 'Admin' || audit.userId === user?.id;

                  return (
                    <tr
                      key={audit.id}
                      onClick={() => {
                        setSelectedAudit(audit);
                        setSearchParams({ selected: audit.id }, { replace: true });
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {new Date(audit.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {audit.promptText}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {audit.userName} · {audit.findingsJson.findings.length}{' '}
                          finding(s) · {audit.scanCategories.slice(0, 2).join(', ')}
                        </p>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {audit.targetModel}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold ${riskMeta.colorClass}`}
                        >
                          <RiskIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{audit.riskLevel}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-slate-900 whitespace-nowrap">
                        {audit.overallTrustScore}/100
                      </td>

                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canDelete && (
                          <>
                            {confirmDeleteId === audit.id ? (
                              <div className="inline-flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAudit(audit.id)}
                                  className="font-semibold text-red-600 hover:underline"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                aria-label="Delete audit record"
                                onClick={() => setConfirmDeleteId(audit.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="px-4 py-3 sm:px-5 flex items-center justify-between text-xs text-slate-600">
            <span className="font-mono tabular-nums">
              Page {page} of {totalPages} · {total} total audit(s)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Audit Full Report Inspection */}
      {selectedAudit && (
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-slate-700">
            Selected Audit Inspection Report
          </h2>
          <AuditReportCard audit={selectedAudit} />
        </div>
      )}
    </div>
  );
}
