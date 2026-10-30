import type { AuditRecord, ComplianceControl } from '../shared/schemas';

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportAuditsAsJson(audits: AuditRecord[], filenamePrefix = 'ai-security-audits'): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const payload = {
    exportedAt: new Date().toISOString(),
    platform: 'AI Security, Privacy & Trust',
    recordCount: audits.length,
    audits,
  };
  triggerDownload(
    JSON.stringify(payload, null, 2),
    `${filenamePrefix}-${stamp}.json`,
    'application/json;charset=utf-8;'
  );
}

export function exportAuditsAsCsv(audits: AuditRecord[], filenamePrefix = 'ai-security-audits'): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = [
    'Audit ID',
    'Timestamp (UTC)',
    'Auditor / Submitter',
    'Email',
    'Target Model',
    'Trust Score',
    'Risk Level',
    'Policy Gate Passed',
    'PII Matches',
    'Findings Count',
    'Evaluated Domains',
    'Executive Summary',
    'Prompt Excerpt',
  ];

  const rows = audits.map((a) => [
    a.id,
    a.createdAt,
    a.userName,
    a.userEmail,
    a.targetModel,
    a.overallTrustScore,
    a.riskLevel,
    a.policyPassed ? 'PASS' : 'FAIL',
    a.piiSummary.totalMatches,
    a.findingsJson.findings.length,
    a.scanCategories.join(' | '),
    a.findingsJson.summary,
    a.promptText.slice(0, 300),
  ]);

  const csv = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ].join('\n');

  triggerDownload(csv, `${filenamePrefix}-${stamp}.csv`, 'text/csv;charset=utf-8;');
}

export function exportComplianceAsCsv(
  controls: ComplianceControl[],
  filenamePrefix = 'ai-compliance-matrix'
): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = [
    'Framework',
    'Control Code',
    'Control Title',
    'Trust Domain',
    'Status',
    'Auditor Notes',
    'Last Updated By',
    'Updated At (UTC)',
  ];

  const rows = controls.map((c) => [
    c.frameworkName,
    c.controlCode,
    c.title,
    c.domain,
    c.status,
    c.notes,
    c.updatedBy,
    c.updatedAt,
  ]);

  const csv = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ].join('\n');

  triggerDownload(csv, `${filenamePrefix}-${stamp}.csv`, 'text/csv;charset=utf-8;');
}

export function exportComplianceAsJson(
  controls: ComplianceControl[],
  filenamePrefix = 'ai-compliance-matrix'
): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const payload = {
    exportedAt: new Date().toISOString(),
    platform: 'AI Security, Privacy & Trust',
    controlCount: controls.length,
    controls,
  };
  triggerDownload(
    JSON.stringify(payload, null, 2),
    `${filenamePrefix}-${stamp}.json`,
    'application/json;charset=utf-8;'
  );
}
