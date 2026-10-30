import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Search,
} from 'lucide-react';
import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_STATUSES,
  type ComplianceControl,
  type ComplianceStatus,
} from '../shared/schemas';

interface ComplianceTableProps {
  controls: ComplianceControl[];
  canEdit: boolean;
  updatingId: string | null;
  onUpdateControl: (
    id: string,
    payload: { status: ComplianceStatus; notes?: string }
  ) => Promise<void>;
}

function getStatusMeta(status: ComplianceStatus) {
  switch (status) {
    case 'Compliant':
      return {
        color: 'text-emerald-700',
        Icon: CheckCircle2,
      };
    case 'Action Required':
      return {
        color: 'text-amber-700',
        Icon: AlertTriangle,
      };
    case 'Non-Compliant':
      return {
        color: 'text-red-700',
        Icon: AlertCircle,
      };
    case 'Not Evaluated':
    default:
      return {
        color: 'text-slate-500',
        Icon: Clock,
      };
  }
}

export function ComplianceTable({
  controls,
  canEdit,
  updatingId,
  onUpdateControl,
}: ComplianceTableProps) {
  const [selectedFramework, setSelectedFramework] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<string>('');

  const filteredControls = useMemo(() => {
    return controls.filter((control) => {
      if (
        selectedFramework !== 'ALL' &&
        control.frameworkName !== selectedFramework
      ) {
        return false;
      }
      if (selectedStatus !== 'ALL' && control.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matches =
          control.controlCode.toLowerCase().includes(q) ||
          control.title.toLowerCase().includes(q) ||
          control.description.toLowerCase().includes(q) ||
          control.domain.toLowerCase().includes(q) ||
          control.notes.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [controls, selectedFramework, selectedStatus, searchQuery]);

  const startEditNotes = (control: ComplianceControl) => {
    setEditingNotesId(control.id);
    setDraftNotes(control.notes || '');
  };

  const saveNotes = async (control: ComplianceControl) => {
    await onUpdateControl(control.id, {
      status: control.status,
      notes: draftNotes,
    });
    setEditingNotesId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Interactive Framework Segmented Filter */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', ...COMPLIANCE_FRAMEWORKS] as const).map((fw) => (
              <button
                key={fw}
                type="button"
                onClick={() => setSelectedFramework(fw)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedFramework === fw
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fw === 'ALL' ? 'All Frameworks' : fw}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter control code, title, or domain..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Status Filter & RBAC Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', ...COMPLIANCE_STATUSES] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedStatus === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>

          {!canEdit && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Read-only view · Admin or Security Auditor role required to
                modify controls
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Data Grid */}
      {filteredControls.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No matching compliance controls
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Adjust the selected framework, status filter, or search query.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedFramework('ALL');
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">Control ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Framework</th>
                <th className="py-3 px-4">Control Requirement &amp; Evidence</th>
                <th className="py-3 px-4 whitespace-nowrap">Trust Domain</th>
                <th className="py-3 px-4 whitespace-nowrap">Posture Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Last Verified
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredControls.map((control) => {
                const statusMeta = getStatusMeta(control.status);
                const StatusIcon = statusMeta.Icon;
                const isUpdating = updatingId === control.id;
                const isEditingNote = editingNotesId === control.id;

                return (
                  <tr
                    key={control.id}
                    className="hover:bg-slate-50/60 align-top transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {control.controlCode}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {control.frameworkName}
                    </td>

                    <td className="py-3.5 px-4 min-w-[280px] max-w-xl">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {control.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {control.description}
                      </p>

                      {isEditingNote ? (
                        <div className="mt-2.5 space-y-2">
                          <textarea
                            rows={2}
                            value={draftNotes}
                            onChange={(e) => setDraftNotes(e.target.value)}
                            placeholder="Document audit evidence, ticket reference, or compensating control..."
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => saveNotes(control)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap"
                            >
                              Save Evidence
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNotesId(null)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>
                            Evidence:{' '}
                            <span className="text-slate-700">
                              {control.notes || 'No auditor notes recorded.'}
                            </span>
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => startEditNotes(control)}
                              className="text-blue-600 hover:underline font-medium whitespace-nowrap"
                            >
                              Edit note
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {control.domain}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {canEdit ? (
                        <select
                          aria-label={`Update status for ${control.controlCode}`}
                          disabled={isUpdating}
                          value={control.status}
                          onChange={(e) =>
                            onUpdateControl(control.id, {
                              status: e.target.value as ComplianceStatus,
                              notes: control.notes,
                            })
                          }
                          className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                        >
                          {COMPLIANCE_STATUSES.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{control.status}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      <div className="font-mono tabular-nums text-slate-700">
                        {new Date(control.updatedAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {control.updatedBy}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
