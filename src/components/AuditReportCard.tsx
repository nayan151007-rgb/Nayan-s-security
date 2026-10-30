import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { AuditRecord, RiskLevel } from '../shared/schemas';
import { exportAuditsAsCsv, exportAuditsAsJson } from '../utils/exportUtils';

interface AuditReportCardProps {
  audit: AuditRecord;
}

export function getRiskTextMeta(level: RiskLevel) {
  switch (level) {
    case 'CRITICAL':
      return {
        label: 'CRITICAL RISK',
        colorClass: 'text-red-700',
        barClass: 'bg-red-600',
        Icon: AlertOctagon,
      };
    case 'HIGH':
      return {
        label: 'HIGH RISK',
        colorClass: 'text-orange-700',
        barClass: 'bg-orange-600',
        Icon: ShieldAlert,
      };
    case 'MEDIUM':
      return {
        label: 'MEDIUM RISK',
        colorClass: 'text-amber-700',
        barClass: 'bg-amber-500',
        Icon: AlertTriangle,
      };
    case 'LOW':
    default:
      return {
        label: 'LOW RISK',
        colorClass: 'text-emerald-700',
        barClass: 'bg-emerald-600',
        Icon: ShieldCheck,
      };
  }
}

export function AuditReportCard({ audit }: AuditReportCardProps) {
  const riskMeta = getRiskTextMeta(audit.riskLevel);
  const RiskIcon = riskMeta.Icon;
  const formattedTime = new Date(audit.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const scoreBarColor =
    audit.overallTrustScore >= 80
      ? 'bg-emerald-600'
      : audit.overallTrustScore >= 60
        ? 'bg-amber-500'
        : 'bg-red-600';

  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
      {/* Header & Export Actions */}
      <div className="p-5 sm:p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 font-bold ${riskMeta.colorClass}`}>
              <RiskIcon className="w-4 h-4 shrink-0" />
              <span>{riskMeta.label}</span>
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span
              className={`font-semibold ${
                audit.policyPassed ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {audit.policyPassed ? 'Policy Gate Passed' : 'Policy Gate Blocked'}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-mono text-slate-600">{audit.targetModel}</span>
          </div>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            Advisory Security &amp; Trust Assessment
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono tabular-nums">{formattedTime}</span>
            <span aria-hidden="true">·</span>
            <span>Evaluated by {audit.userName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ID {audit.id.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportAuditsAsJson([audit], `audit-${audit.id.slice(0, 8)}`)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportAuditsAsCsv([audit], `audit-${audit.id.slice(0, 8)}`)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Trust Score Meter & Executive Summary */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Overall Trust Score
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {audit.overallTrustScore}
              <span className="text-sm font-normal text-slate-500">/100</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${scoreBarColor} rounded-full transition-opacity`}
              style={{ width: `${Math.max(3, audit.overallTrustScore)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500">
            Domains: {audit.scanCategories.join(' · ')}
          </div>
        </div>

        <div className="md:col-span-8 md:border-l md:border-slate-200 md:pl-6 space-y-2.5">
          <div className="text-xs font-semibold text-slate-700">
            Executive Assessment Summary
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {audit.findingsJson.summary}
          </p>

          {audit.piiSummary.totalMatches > 0 && (
            <p className="text-xs text-amber-800 font-medium pt-1">
              Pre-Scan PII &amp; Secret Sanitizer intercepted{' '}
              <span className="font-mono tabular-nums">
                {audit.piiSummary.totalMatches}
              </span>{' '}
              pattern match(es): {audit.piiSummary.detectedTypes.join(', ')}
              {audit.piiSummary.redacted
                ? ' (masked prior to upstream API evaluation).'
                : '.'}
            </p>
          )}
        </div>
      </div>

      {/* Findings Breakdown */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-900">
            Identified Threat Vectors &amp; Developer Remediations
          </h4>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {audit.findingsJson.findings.length} finding(s)
          </span>
        </div>

        {audit.findingsJson.findings.length === 0 ? (
          <div className="py-6 flex items-start gap-3 text-sm text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">
                Zero High-Confidence Vulnerabilities Detected
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                The evaluated prompt and output satisfied all selected AI trust,
                privacy, and governance checks without triggering adversarial or
                data-leakage flags.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {audit.findingsJson.findings.map((finding, idx) => {
              const sevMeta = getRiskTextMeta(finding.severity);
              const SevIcon = sevMeta.Icon;

              return (
                <div key={`${finding.title}-${idx}`} className="py-4 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${sevMeta.colorClass}`}
                    >
                      <SevIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{finding.severity}</span>
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-semibold text-slate-700">
                      {finding.category}
                    </span>
                  </div>

                  <h5 className="text-sm font-semibold text-slate-900">
                    {finding.title}
                  </h5>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {finding.description}
                  </p>

                  <div className="pt-1">
                    <span className="text-xs font-semibold text-slate-900">
                      Recommended Remediation:{' '}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {finding.remediation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluated Prompt / Response Snapshot */}
      <div className="p-5 sm:p-6 bg-slate-50/50 rounded-b-xl space-y-4">
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-1.5">
            Inspected Input Prompt
          </div>
          <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-words leading-relaxed max-h-40 overflow-y-auto">
            {audit.promptText}
          </pre>
        </div>

        {audit.responseText && audit.responseText.trim().length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-1.5">
              Inspected Model Response
            </div>
            <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-words leading-relaxed max-h-40 overflow-y-auto">
              {audit.responseText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
