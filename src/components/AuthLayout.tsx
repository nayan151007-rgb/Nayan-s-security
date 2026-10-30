import React from 'react';
import { Lock, Scale, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900">
      {/* Left Enterprise Context Column */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-900 text-slate-100 flex-col justify-between p-12 border-r border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">
              AI Security, Privacy &amp; Trust
            </span>
          </div>

          <div className="mt-16 max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight text-balance">
              Continuous red-teaming and regulatory assurance for enterprise AI.
            </h1>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Audit LLM prompts and responses against adversarial injection, PII
              exposure, hallucination risk, and multi-framework compliance
              mandates before production deployment.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 space-y-6">
            <div className="flex items-start gap-3.5">
              <Lock className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Server-Side Gemini Evaluation Proxy
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Deterministic pre-inference PII redaction, sliding-window rate
                  limiting, and schema-verified JSON threat reports.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Scale className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Multi-Framework GRC Alignment
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Track control posture across EU AI Act, NIST AI RMF 1.0, and
                  ISO/IEC 42001 with role-isolated audit logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>EU AI Act · NIST AI RMF · ISO/IEC 42001</span>
          <span className="font-mono tabular-nums">RBAC + JWT</span>
        </div>
      </div>

      {/* Right Authentication Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-base font-bold tracking-tight text-slate-900">
              AI Security, Privacy &amp; Trust
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
