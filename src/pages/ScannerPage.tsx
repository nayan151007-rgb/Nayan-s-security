import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuditReportCard, getRiskTextMeta } from '../components/AuditReportCard';
import { ScanForm } from '../components/ScanForm';
import { useToast } from '../context/ToastContext';
import { auditsApi, extractApiError, scanApi } from '../services/api';
import type {
  AuditRecord,
  TargetModel,
  TrustCategory,
} from '../shared/schemas';

export function ScannerPage() {
  const { notify } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [activeReport, setActiveReport] = useState<AuditRecord | null>(null);
  const [recentScans, setRecentScans] = useState<AuditRecord[]>([]);

  useEffect(() => {
    auditsApi
      .list({ page: 1, limit: 4 })
      .then((res) => {
        setRecentScans(res.items);
        if (res.items.length > 0) {
          setActiveReport((prev) => prev ?? res.items[0]);
        }
      })
      .catch(() => {
        // Silent fallback if empty
      });
  }, []);

  const handleRunScan = async (payload: {
    targetModel: TargetModel;
    promptText: string;
    responseText: string;
    scanCategories: TrustCategory[];
  }) => {
    setIsScanning(true);
    try {
      const audit = await scanApi.runScan(payload);
      setActiveReport(audit);
      setRecentScans((prev) => [audit, ...prev.slice(0, 3)]);

      notify({
        variant:
          audit.riskLevel === 'CRITICAL' || audit.riskLevel === 'HIGH'
            ? 'warning'
            : 'success',
        title: `Audit Complete · Trust Score ${audit.overallTrustScore}/100 (${audit.riskLevel})`,
        description: `${audit.findingsJson.findings.length} finding(s) recorded to persistent audit log.`,
      });
    } catch (err) {
      const msg = extractApiError(
        err,
        'Gemini security evaluation could not be completed.'
      );
      notify({
        variant: 'error',
        title: 'Security Scan Failed',
        description: msg,
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          AI Vulnerability &amp; Red-Team Scanner
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Test LLM prompts and completions against adversarial injection, PII
          leakage, toxicity, hallucination risk, and regulatory alignment via
          server-proxied Gemini inspection.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Input Console */}
        <div className="xl:col-span-5 space-y-5">
          <ScanForm isScanning={isScanning} onSubmitScan={handleRunScan} />

          {recentScans.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              <div className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                Recent Evaluations (Click to Inspect)
              </div>
              {recentScans.map((scan) => {
                const riskMeta = getRiskTextMeta(scan.riskLevel);
                const selected = activeReport?.id === scan.id;
                return (
                  <button
                    key={scan.id}
                    type="button"
                    onClick={() => setActiveReport(scan)}
                    className={`w-full px-5 py-3 text-left transition-colors flex items-center justify-between gap-3 ${
                      selected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {scan.promptText}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className={`font-semibold ${riskMeta.colorClass}`}>
                          {scan.riskLevel}
                        </span>{' '}
                        · {scan.targetModel}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-bold text-slate-900 shrink-0">
                      {scan.overallTrustScore}/100
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Advisory Output Panel */}
        <div className="xl:col-span-7">
          {activeReport ? (
            <AuditReportCard audit={activeReport} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto" />
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                Ready for Adversarial &amp; Privacy Inspection
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Select a red-team preset vector or enter a custom prompt on the
                left and click <strong>Run Security Audit</strong> to generate a
                structured Gemini evaluation report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
