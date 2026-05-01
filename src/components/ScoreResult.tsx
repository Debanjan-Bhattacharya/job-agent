'use client';

import { useState } from 'react';

interface ScoreBreakdownEntry {
  label: string;
  jd_weight: number;
  evidence_score: number;
  weighted_contribution: number;
  snapshot: 'strong' | 'moderate' | 'weak';
  reasoning: string;
}

interface TailoringPriority {
  category: string;
  jd_weight: number;
  current_evidence_score: number;
  gap: number;
  what_jd_needs: string;
  what_cv_has: string;
  tailoring_action: string;
}

interface MandatoryGate {
  category?: string;
  requirement?: string;
}

interface ScoreResultProps {
  result: Record<string, unknown>;
}

function ConfidenceBadge({ level }: { level: string }) {
  const cls =
    level === 'high'
      ? 'bg-green-100 text-green-800'
      : level === 'medium'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{level}</span>
  );
}

function snapshotCls(snapshot: string) {
  if (snapshot === 'strong') return 'border-green-200 bg-green-50 text-green-900';
  if (snapshot === 'moderate') return 'border-yellow-200 bg-yellow-50 text-yellow-900';
  return 'border-red-200 bg-red-50 text-red-900';
}

function gateLabel(gate: unknown): string {
  if (typeof gate === 'string') return gate;
  const g = gate as MandatoryGate;
  return g.requirement ?? JSON.stringify(gate);
}

export default function ScoreResult({ result }: ScoreResultProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const overall = result.overall_score as number | undefined;
  const scoreConf = result.score_confidence as string | undefined;
  const capApplied = result.mandatory_gate_cap_applied as boolean | undefined;
  const tier = result.experience_tier as string | undefined;
  const relevantYears = result.relevant_years_experience as number | undefined;
  const halfLife = result.knowledge_half_life as string | undefined;
  const mandatoryGates = result.mandatory_gates as
    | { passed: unknown[]; failed: unknown[] }
    | undefined;
  const breakdown = result.score_breakdown as Record<string, ScoreBreakdownEntry> | undefined;
  const cannotAssess = result.cannot_assess_from_cv as string[] | undefined;
  const candidateInputs = result.candidate_inputs_needed as string[] | undefined;
  const tailoring = result.tailoring_priorities as TailoringPriority[] | undefined;

  const jdAnalysis = result.jd_analysis as Record<string, unknown> | undefined;
  const cvAnalysis = result.cv_analysis as Record<string, unknown> | undefined;
  const jdConf = jdAnalysis?.jd_confidence as string | undefined;
  const cvConf = cvAnalysis?.cv_confidence as string | undefined;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const scoreColor =
    overall == null ? 'text-gray-500' : overall >= 70 ? 'text-green-600' : overall >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Overall score header */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-end gap-3">
          <span className={`text-6xl font-bold ${scoreColor}`}>{overall ?? '—'}</span>
          <span className="text-gray-400 text-xl mb-1">/ 100</span>
          {capApplied && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium mb-1">
              capped — mandatory gate failed
            </span>
          )}
        </div>

        {/* Confidence badges */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {scoreConf && (
            <span className="flex items-center gap-1.5">
              Score confidence: <ConfidenceBadge level={scoreConf} />
            </span>
          )}
          {jdConf && (
            <span className="flex items-center gap-1.5">
              JD confidence: <ConfidenceBadge level={jdConf} />
            </span>
          )}
          {cvConf && (
            <span className="flex items-center gap-1.5">
              CV confidence: <ConfidenceBadge level={cvConf} />
            </span>
          )}
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {tier && (
            <span>
              Tier: <span className="font-medium text-gray-700">{tier}</span>
            </span>
          )}
          {relevantYears != null && (
            <span>
              Relevant exp:{' '}
              <span className="font-medium text-gray-700">{relevantYears} yrs</span>
            </span>
          )}
          {halfLife && (
            <span>
              Knowledge half-life:{' '}
              <span className="font-medium text-gray-700">{halfLife}</span>
            </span>
          )}
        </div>
      </div>

      {/* Mandatory gates — failed */}
      {mandatoryGates && mandatoryGates.failed.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Mandatory gates failed</h3>
          <ul className="space-y-1">
            {mandatoryGates.failed.map((f, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5 font-bold">✕</span>
                {gateLabel(f)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Score breakdown</h3>
          {Object.entries(breakdown).map(([id, entry]) => (
            <div
              key={id}
              className={`border rounded-lg overflow-hidden ${snapshotCls(entry.snapshot)}`}
            >
              <button
                className="w-full px-4 py-3 flex items-center justify-between text-left"
                onClick={() => toggle(id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{entry.label ?? id}</span>
                  <span className="text-xs opacity-60">weight {entry.jd_weight}%</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold">{entry.evidence_score}</span>
                  <span className="text-xs opacity-50">({entry.weighted_contribution} pts)</span>
                  <span className="text-xs opacity-50">{expanded.has(id) ? '▲' : '▼'}</span>
                </div>
              </button>
              {expanded.has(id) && (
                <div className="px-4 pb-3 pt-2 text-xs leading-relaxed border-t border-current border-opacity-20">
                  {entry.reasoning}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tailoring priorities */}
      {tailoring && tailoring.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Tailoring priorities</h3>
          {tailoring.map((t, i) => (
            <div
              key={i}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  {t.category}
                </span>
                <span className="text-xs text-blue-400">
                  weight {t.jd_weight}% · score {t.current_evidence_score} · gap {t.gap}
                </span>
              </div>
              <p className="text-sm text-blue-900 font-medium">{t.tailoring_action}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 pt-1">
                <div>
                  <span className="font-medium">JD needs: </span>
                  {t.what_jd_needs}
                </div>
                <div>
                  <span className="font-medium">CV has: </span>
                  {t.what_cv_has}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate inputs needed */}
      {candidateInputs && candidateInputs.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
          <h3 className="font-semibold text-yellow-800">Questions that could improve your score</h3>
          <ul className="space-y-1.5">
            {candidateInputs.map((q, i) => (
              <li key={i} className="text-sm text-yellow-900 flex items-start gap-2">
                <span className="text-yellow-500 font-bold mt-0.5">?</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cannot assess */}
      {cannotAssess && cannotAssess.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-700">Cannot assess from CV</h3>
          <ul className="space-y-1">
            {cannotAssess.map((item, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="mt-0.5">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
