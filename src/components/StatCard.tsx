import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  contextText: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
}

export function StatCard({
  label,
  value,
  unit,
  contextText,
  tone = 'neutral',
}: StatCardProps) {
  const toneColor =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'danger'
          ? 'text-red-700'
          : 'text-slate-600';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-mono tabular-nums text-slate-500">
            {unit}
          </span>
        )}
      </div>
      <div className={`mt-2.5 text-xs ${toneColor}`}>{contextText}</div>
    </div>
  );
}
