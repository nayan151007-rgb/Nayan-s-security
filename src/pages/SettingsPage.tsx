import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Lock, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  extractApiError,
  settingsApi,
  type SecurityPostureInfo,
} from '../services/api';
import {
  orgSettingsSchema,
  updateProfileSchema,
  type OrganizationSettings,
} from '../shared/schemas';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();

  // User Profile State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Organization Governance Policy State
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(
    null
  );
  const [posture, setPosture] = useState<SecurityPostureInfo | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);
  const [loadingOrg, setLoadingOrg] = useState(true);

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setDepartment(user.department);
      setJobTitle(user.jobTitle);
    }
  }, [user]);

  useEffect(() => {
    settingsApi
      .getOrganization()
      .then((res) => {
        setOrgSettings(res.settings);
        setPosture(res.securityPosture);
      })
      .catch((err) => {
        notify({
          variant: 'error',
          title: 'Failed to load organization settings',
          description: extractApiError(err),
        });
      })
      .finally(() => setLoadingOrg(false));
  }, [notify]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = updateProfileSchema.safeParse({
      fullName,
      department,
      jobTitle,
    });
    if (!parsed.success) {
      notify({
        variant: 'error',
        title: 'Invalid profile fields',
        description: parsed.error.issues[0]?.message,
      });
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(parsed.data);
      notify({
        variant: 'success',
        title: 'Account profile saved',
      });
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Profile update failed',
        description: extractApiError(err),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgSettings) return;

    const parsed = orgSettingsSchema.safeParse({
      organizationName: orgSettings.organizationName,
      minTrustScoreThreshold: Number(orgSettings.minTrustScoreThreshold),
      piiRedactionEnabled: orgSettings.piiRedactionEnabled,
      blockCriticalPrompts: orgSettings.blockCriticalPrompts,
      auditRetentionDays: Number(orgSettings.auditRetentionDays),
    });

    if (!parsed.success) {
      notify({
        variant: 'error',
        title: 'Invalid policy configuration',
        description: parsed.error.issues[0]?.message,
      });
      return;
    }

    setSavingOrg(true);
    try {
      const updated = await settingsApi.updateOrganization(parsed.data);
      setOrgSettings(updated);
      notify({
        variant: 'success',
        title: 'Organization governance policy updated',
      });
    } catch (err) {
      notify({
        variant: 'error',
        title: 'Policy update failed',
        description: extractApiError(err),
      });
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Account &amp; Governance Policy Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Manage your authenticated operator profile, inspect RBAC permissions,
          and configure organization-wide AI release gates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: User Profile & RBAC Permissions */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
          >
            <div className="p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Operator Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Identity attributed on audit logs and compliance sign-offs.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned RBAC Role
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    user?.role === 'Developer'
                      ? 'Developer · Row-Level Isolated Scope'
                      : `${user?.role} · Organization-Wide Scope`
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-dept"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Department
                  </label>
                  <input
                    id="profile-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-title"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Job Title
                  </label>
                  <input
                    id="profile-title"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50/70 rounded-b-xl flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
              >
                {savingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Profile</span>
              </button>
            </div>
          </form>

          {/* Backend Security Architecture Summary */}
          {posture && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              <div className="p-5 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <h2 className="text-base font-semibold text-slate-900">
                  Security &amp; Proxy Enforcement Posture
                </h2>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Server-Side Gemini SDK Isolation
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enforced</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Gemini Evaluation Service Status
                  </span>
                  <span
                    className={`font-semibold ${
                      posture.geminiEvaluationReady
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {posture.geminiEvaluationReady
                      ? 'Ready'
                      : 'Check Settings > Secrets'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Password Hashing (bcrypt cost factor)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {posture.bcryptCostFactor} rounds
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Scanner Rate Limiter Window
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {posture.scanRateLimitPer15m} scans / 15 min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Row-Level Data Isolation (RLS)
                  </span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Organization Governance Policy */}
        <div className="lg:col-span-6">
          {loadingOrg || !orgSettings ? (
            <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ) : (
            <form
              onSubmit={handleSaveOrgSettings}
              className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
            >
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    Organization Governance Policy
                  </h2>
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Admin only</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure automated PII sanitization, trust score release
                  thresholds, and audit retention policies.
                </p>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label
                    htmlFor="org-name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Organization Name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    disabled={!isAdmin}
                    value={orgSettings.organizationName}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        organizationName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="org-threshold"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Minimum Policy Gate Trust Score
                    </label>
                    <span className="text-xs font-mono tabular-nums font-bold text-slate-900">
                      {orgSettings.minTrustScoreThreshold} / 100
                    </span>
                  </div>
                  <input
                    id="org-threshold"
                    type="range"
                    min={0}
                    max={100}
                    disabled={!isAdmin}
                    value={orgSettings.minTrustScoreThreshold}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        minTrustScoreThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Scans scoring below this threshold are marked as Policy Gate
                    Blocked in audit telemetry.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={orgSettings.piiRedactionEnabled}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        piiRedactionEnabled: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Automatic Pre-Scan PII &amp; Secret Redaction
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Mask SSNs, payment card numbers, emails, phone numbers,
                      and API keys with deterministic tokens prior to upstream
                      model inspection and audit persistence.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={orgSettings.blockCriticalPrompts}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        blockCriticalPrompts: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Auto-Block CRITICAL Severity Findings
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Automatically fail policy gate checks whenever a CRITICAL
                      prompt injection or credential leak is flagged, regardless
                      of aggregate score.
                    </p>
                  </div>
                </label>

                <div>
                  <label
                    htmlFor="org-retention"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Audit Log Retention Window (Days)
                  </label>
                  <input
                    id="org-retention"
                    type="number"
                    min={7}
                    max={3650}
                    disabled={!isAdmin}
                    value={orgSettings.auditRetentionDays}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        auditRetentionDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50/70 rounded-b-xl flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Last updated by {orgSettings.updatedBy}
                </span>
                {isAdmin && (
                  <button
                    type="submit"
                    disabled={savingOrg}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
                  >
                    {savingOrg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Update Policy</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
