import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileJson } from 'lucide-react';
import { ComplianceTable } from '../components/ComplianceTable';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complianceApi, extractApiError } from '../services/api';
import type {
  ComplianceControl,
  ComplianceStatus,
  DashboardMetrics,
} from '../shared/schemas';
import {
  exportComplianceAsCsv,
  exportComplianceAsJson,
} from '../utils/exportUtils';

export function CompliancePage() {
  const { user } = useAuth();
  const { notify } = useToast();

  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [summaries, setSummaries] = useState<
    DashboardMetrics['frameworkSummaries']
  >([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canEdit =
    user?.role === 'Admin' || user?.role === 'Security Auditor';

  const loadCompliance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await complianceApi.list('ALL');
      setControls(data.controls);
      setSummaries(data.summaries);
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Failed to load compliance frameworks',
        description: extractApiError(err),
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadCompliance();
  }, [loadCompliance]);

  const handleUpdateControl = async (
    id: string,
    payload: { status: ComplianceStatus; notes?: string }
  ) => {
    setUpdatingId(id);
    try {
      const { control, summaries: updatedSummaries } =
        await complianceApi.updateControl(id, payload);
      setControls((prev) => prev.map((c) => (c.id === id ? control : c)));
      setSummaries(updatedSummaries);
      notify({
        variant: 'success',
        title: `${control.controlCode} updated to ${control.status}`,
      });
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Unable to update control',
        description: extractApiError(err),
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Regulatory Compliance &amp; Governance Frameworks
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Map enterprise AI systems to EU AI Act, NIST AI RMF 1.0, and
            ISO/IEC 42001:2023 controls with auditable evidence notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={controls.length === 0}
            onClick={() => exportComplianceAsJson(controls)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            disabled={controls.length === 0}
            onClick={() => exportComplianceAsCsv(controls)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3-Column Framework Readiness Strip */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaries.map((fw) => (
            <div
              key={fw.frameworkName}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {fw.frameworkName}
                </h2>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {fw.alignmentPct}%
                </span>
              </div>

              <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    fw.alignmentPct >= 80
                      ? 'bg-emerald-600'
                      : fw.alignmentPct >= 60
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(4, fw.alignmentPct)}%` }}
                />
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
                <span className="text-emerald-700 font-semibold">
                  {fw.compliantCount} compliant
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-semibold">
                  {fw.actionRequiredCount} action req
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-red-700 font-semibold">
                  {fw.nonCompliantCount} non-compliant
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Control Matrix */}
      {!loading && (
        <ComplianceTable
          controls={controls}
          canEdit={canEdit}
          updatingId={updatingId}
          onUpdateControl={handleUpdateControl}
        />
      )}
    </div>
  );
}
