import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Download,
  RefreshCw,
  ScanSearch,
} from 'lucide-react';
import { getRiskTextMeta } from '../components/AuditReportCard';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardApi, extractApiError } from '../services/api';
import { RISK_LEVELS, type DashboardMetrics } from '../shared/schemas';
import { exportAuditsAsCsv } from '../utils/exportUtils';

export function DashboardPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      const msg = extractApiError(err, 'Failed to load dashboard metrics.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-32 bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
            >
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded mt-4" />
              <div className="h-3 w-40 bg-slate-100 rounded mt-3" />
            </div>
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          Unable to load security posture metrics
        </h2>
        <p className="text-xs text-slate-600 mt-1">{error}</p>
        <button
          type="button"
          onClick={() => fetchMetrics()}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxCategoryCount = Math.max(
    1,
    ...metrics.categoryBreakdown.map((c) => c.count)
  );

  // Build SVG polyline coordinates for 7-day Trust Score trend
  const chartWidth = 640;
  const chartHeight = 160;
  const padX = 28;
  const padY = 20;
  const usableW = chartWidth - padX * 2;
  const usableH = chartHeight - padY * 2;

  const points = metrics.trendSeries.map((pt, i) => {
    const x =
      metrics.trendSeries.length > 1
        ? padX + (i / (metrics.trendSeries.length - 1)) * usableW
        : chartWidth / 2;
    const y = padY + ((100 - pt.avgScore) / 100) * usableH;
    return { x, y, ...pt };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints =
    points.length > 0
      ? `${points[0].x},${chartHeight - padY} ${polylinePoints} ${
          points[points.length - 1].x
        },${chartHeight - padY}`
      : '';

  return (
    <div className="space-y-6">
      {/* Workspace Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            AI Security &amp; Governance Posture
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {user?.role === 'Developer'
              ? 'Row-level isolated view of your AI prompt security evaluations and organization framework readiness.'
              : 'Organization-wide AI vulnerability telemetry, risk distribution, and regulatory compliance readiness.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              fetchMetrics(true);
              notify({
                variant: 'info',
                title: 'Telemetry refreshed',
                description: 'Latest security metrics synchronized.',
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {metrics.recentAudits.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportAuditsAsCsv(metrics.recentAudits, 'dashboard-recent-audits')
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Summary CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Evaluated Prompts"
          value={metrics.totalScans}
          unit="audits"
          contextText={`${metrics.policyPassRate}% passed minimum trust gate`}
          tone="neutral"
        />
        <StatCard
          label="Average AI Trust Score"
          value={metrics.averageTrustScore}
          unit="/ 100"
          contextText={
            metrics.averageTrustScore >= 75
              ? 'Meets enterprise release threshold (75)'
              : 'Below enterprise release threshold (75)'
          }
          tone={metrics.averageTrustScore >= 75 ? 'positive' : 'warning'}
        />
        <StatCard
          label="High & Critical Risk Flags"
          value={metrics.highRiskFlags}
          unit={`(${metrics.criticalFlags} critical)`}
          contextText={
            metrics.highRiskFlags === 0
              ? 'Zero severe findings in active scope'
              : 'Requires prompt remediation or DLP filter'
          }
          tone={metrics.highRiskFlags > 0 ? 'danger' : 'positive'}
        />
        <StatCard
          label="Regulatory Framework Readiness"
          value={`${metrics.complianceAlignmentPct}%`}
          contextText="Weighted across EU AI Act, NIST, ISO 42001"
          tone={metrics.complianceAlignmentPct >= 75 ? 'positive' : 'warning'}
        />
      </div>

      {/* Middle Analytical Row: 7-Day Trend + Domain Vulnerability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 7-Day Trust Score & Volume Trend */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                7-Day Rolling Trust Score Trajectory
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                Scale 0–100 · Target ≥ 75
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily mean Gemini security score across inspected prompt payloads.
            </p>
          </div>

          <div className="mt-5">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
              role="img"
              aria-label="7-day average trust score chart"
            >
              {/* Threshold Reference Line at 75 */}
              <line
                x1={padX}
                y1={padY + ((100 - 75) / 100) * usableH}
                x2={chartWidth - padX}
                y2={padY + ((100 - 75) / 100) * usableH}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={chartWidth - padX}
                y={padY + ((100 - 75) / 100) * usableH - 5}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                Policy Gate 75
              </text>

              {areaPoints && (
                <polygon points={areaPoints} fill="rgba(37, 99, 235, 0.08)" />
              )}

              {polylinePoints && (
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.25"
                  points={polylinePoints}
                />
              )}

              {points.map((pt) => (
                <g key={pt.dateLabel}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#1d4ed8"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {pt.dateLabel}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Risk Distribution Strip */}
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {RISK_LEVELS.map((level) => {
              const meta = getRiskTextMeta(level);
              const count = metrics.riskDistribution[level] || 0;
              return (
                <div key={level}>
                  <div className={`text-xs font-bold ${meta.colorClass}`}>
                    {level}
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    {count}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      scans
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vulnerability Breakdown by AI Trust Domain */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Findings by AI Trust Domain
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution of flagged vulnerabilities across the five core trust
              categories.
            </p>

            <div className="mt-5 space-y-4">
              {metrics.categoryBreakdown.map((item) => {
                const widthPct = Math.round(
                  (item.count / maxCategoryCount) * 100
                );
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {item.category}
                      </span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {item.count} total · {item.highOrCriticalCount} severe
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.highOrCriticalCount > 0
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${item.count === 0 ? 2 : Math.max(8, widthPct)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Framework Alignment Mini Matrix */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Compliance Framework Alignment
              </span>
              <button
                type="button"
                onClick={() => navigate('/compliance')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <span>Manage controls</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {metrics.frameworkSummaries.map((fw) => (
                <div key={fw.frameworkName}>
                  <div className="text-xs text-slate-600 truncate">
                    {fw.frameworkName}
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                    {fw.alignmentPct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Audits Table */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Security Evaluations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest prompt and response inspections logged in your access
              scope.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/audits')}
            className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap shrink-0"
          >
            View All Audits
          </button>
        </div>

        {metrics.recentAudits.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No prompt evaluations logged yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Run your first automated security and PII scan using Gemini to
              populate trust metrics and vulnerability findings.
            </p>
            <button
              type="button"
              onClick={() => navigate('/scanner')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ScanSearch className="w-3.5 h-3.5" />
              <span>Run First Security Scan</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4">Prompt Excerpt</th>
                  <th className="py-3 px-4 whitespace-nowrap">Model</th>
                  <th className="py-3 px-4 whitespace-nowrap">Risk Level</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Trust Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {metrics.recentAudits.map((audit) => {
                  const riskMeta = getRiskTextMeta(audit.riskLevel);
                  const RiskIcon = riskMeta.Icon;

                  return (
                    <tr
                      key={audit.id}
                      onClick={() => navigate(`/audits?selected=${audit.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {new Date(audit.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        ·{' '}
                        {new Date(audit.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="text-xs text-slate-900 font-medium truncate">
                          {audit.promptText}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {audit.userName} · {audit.findingsJson.findings.length}{' '}
                          finding(s)
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
