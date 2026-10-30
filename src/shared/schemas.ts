import { z } from 'zod';

export const USER_ROLES = ['Admin', 'Security Auditor', 'Developer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const TRUST_CATEGORIES = [
  'Prompt Security',
  'Data Privacy',
  'Safety & Toxicity',
  'Reliability',
  'Compliance',
] as const;
export type TrustCategory = (typeof TRUST_CATEGORIES)[number];

export const TARGET_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.8-flash',
] as const;
export type TargetModel = (typeof TARGET_MODELS)[number];

export const COMPLIANCE_FRAMEWORKS = [
  'EU AI Act',
  'NIST AI RMF',
  'ISO/IEC 42001',
] as const;
export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];

export const COMPLIANCE_STATUSES = [
  'Not Evaluated',
  'Compliant',
  'Action Required',
  'Non-Compliant',
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid corporate or personal email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  role: z.enum(USER_ROLES).optional().default('Developer'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  department: z.string().trim().max(100, 'Department cannot exceed 100 characters').optional(),
  jobTitle: z.string().trim().max(100, 'Job title cannot exceed 100 characters').optional(),
});

export const scanSchema = z.object({
  targetModel: z.enum(TARGET_MODELS).default('gemini-2.5-flash'),
  promptText: z
    .string()
    .trim()
    .min(3, 'Prompt text must be at least 3 characters')
    .max(5000, 'Prompt text exceeds maximum length of 5,000 characters'),
  responseText: z
    .string()
    .max(10000, 'Response text exceeds maximum length of 10,000 characters')
    .optional()
    .default(''),
  scanCategories: z
    .array(z.enum(TRUST_CATEGORIES))
    .min(1, 'Select at least one AI Trust domain to evaluate')
    .optional()
    .default([
      'Prompt Security',
      'Data Privacy',
      'Safety & Toxicity',
      'Reliability',
    ]),
});

export const complianceUpdateSchema = z.object({
  status: z.enum(COMPLIANCE_STATUSES),
  notes: z.string().trim().max(1000, 'Auditor notes cannot exceed 1,000 characters').optional(),
});

export const orgSettingsSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(120, 'Organization name cannot exceed 120 characters'),
  minTrustScoreThreshold: z.number().int().min(0).max(100),
  piiRedactionEnabled: z.boolean(),
  blockCriticalPrompts: z.boolean(),
  auditRetentionDays: z.number().int().min(7).max(3650),
});

export const auditFindingSchema = z.object({
  category: z.enum(TRUST_CATEGORIES),
  severity: z.enum(RISK_LEVELS),
  title: z.string().min(1),
  description: z.string().min(1),
  remediation: z.string().min(1),
});

export const aiAuditReportSchema = z.object({
  overall_trust_score: z.number().int().min(0).max(100),
  risk_level: z.enum(RISK_LEVELS),
  summary: z.string().min(1),
  findings: z.array(auditFindingSchema),
});

export type AuditFinding = z.infer<typeof auditFindingSchema>;
export type AIAuditReport = z.infer<typeof aiAuditReportSchema>;

export interface PiiDetectionSummary {
  redacted: boolean;
  totalMatches: number;
  detectedTypes: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  jobTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  targetModel: TargetModel;
  promptText: string;
  responseText: string;
  scanCategories: TrustCategory[];
  overallTrustScore: number;
  riskLevel: RiskLevel;
  findingsJson: AIAuditReport;
  piiSummary: PiiDetectionSummary;
  policyPassed: boolean;
  createdAt: string;
}

export interface ComplianceControl {
  id: string;
  frameworkName: ComplianceFramework;
  controlCode: string;
  title: string;
  description: string;
  domain: TrustCategory;
  status: ComplianceStatus;
  notes: string;
  updatedBy: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  organizationName: string;
  minTrustScoreThreshold: number;
  piiRedactionEnabled: boolean;
  blockCriticalPrompts: boolean;
  auditRetentionDays: number;
  updatedAt: string;
  updatedBy: string;
}

export interface DashboardMetrics {
  totalScans: number;
  highRiskFlags: number;
  criticalFlags: number;
  averageTrustScore: number;
  policyPassRate: number;
  complianceAlignmentPct: number;
  riskDistribution: Record<RiskLevel, number>;
  categoryBreakdown: Array<{
    category: TrustCategory;
    count: number;
    highOrCriticalCount: number;
  }>;
  trendSeries: Array<{
    dateLabel: string;
    avgScore: number;
    scanCount: number;
    highRiskCount: number;
  }>;
  frameworkSummaries: Array<{
    frameworkName: ComplianceFramework;
    totalControls: number;
    compliantCount: number;
    actionRequiredCount: number;
    nonCompliantCount: number;
    notEvaluatedCount: number;
    alignmentPct: number;
  }>;
  recentAudits: AuditRecord[];
}
