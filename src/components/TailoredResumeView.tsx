'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ParsedProfile } from '@/types/profile';

// --- types ---

interface TailoredRole {
  role_id: string;
  company: string;
  title: string;
  period: string;
  original_description: string;
  tailored_bullets: string[];
  changes_made: string[];
  quantification_prompts: string[];
}

interface TailoredSkillsSection {
  original_skills: string[];
  tailored_skills: string[];
  deprioritised_skills: string[];
  changes_made: string[];
}

interface TailoredSummarySection {
  original: string;
  tailored: string;
  changes_made: string[];
}

interface GapQuestion {
  question_id: string;
  category: string;
  question: string;
  why_it_matters: string;
  example_answer: string;
}

interface PreApplyFlag {
  flag_type: string;
  severity: 'blocking' | 'advisory';
  message: string;
}

interface TailoringOutput {
  tailoring_summary: {
    overall_approach: string;
    experience_tier: string;
    tone_register: string;
    high_priority_categories: string[];
    cannot_cover_by_tailoring: string[];
  };
  tailored_experience: TailoredRole[];
  tailored_skills: TailoredSkillsSection | string[];
  tailored_summary: TailoredSummarySection;
  gap_questions: GapQuestion[];
  pre_apply_flags: PreApplyFlag[];
}

interface ValidationFabrication {
  bullet: string;
  claim: string;
  reason: string;
}

interface ValidationResult {
  passed: boolean;
  fabrications_found: ValidationFabrication[];
  warnings: string[];
  checked_bullets_count: number;
}

interface TailoredResumeViewProps {
  tailoredOutput: Record<string, unknown>;
  originalProfile: ParsedProfile;
  validationResult: Record<string, unknown>;
  candidateSuppliedContext?: Record<string, string>;
  onReTailor: (context: Record<string, string>) => void;
}

// --- helpers ---

function resolveSkills(raw: unknown): TailoredSkillsSection {
  if (Array.isArray(raw)) {
    return {
      tailored_skills: raw as string[],
      original_skills: [],
      deprioritised_skills: [],
      changes_made: [],
    };
  }
  if (raw && typeof raw === 'object') {
    return raw as TailoredSkillsSection;
  }
  return { tailored_skills: [], original_skills: [], deprioritised_skills: [], changes_made: [] };
}

// --- component ---

export default function TailoredResumeView({
  tailoredOutput,
  originalProfile: _originalProfile,
  validationResult,
  candidateSuppliedContext,
  onReTailor,
}: TailoredResumeViewProps) {
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>({});
  const [quantAnswers, setQuantAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const output = tailoredOutput as unknown as TailoringOutput;
  const validation = validationResult as unknown as ValidationResult;
  const skillsData = resolveSkills(output.tailored_skills);

  const blockingFlags = (output.pre_apply_flags ?? []).filter((f) => f.severity === 'blocking');
  const advisoryFlags = (output.pre_apply_flags ?? []).filter((f) => f.severity === 'advisory');

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const combinedContext = {
        ...(candidateSuppliedContext ?? {}),
        ...gapAnswers,
        ...quantAnswers,
      };
      const { error } = await supabase.from('tailored_resumes').insert({
        user_id: null,
        candidate_profile_id: null,
        jd_hash: null,
        tailored_output: tailoredOutput,
        validation_result: validationResult,
        candidate_supplied_context:
          Object.keys(combinedContext).length > 0 ? combinedContext : null,
      });
      if (error) throw error;
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleReTailor() {
    const combined: Record<string, string> = {
      ...(candidateSuppliedContext ?? {}),
      ...gapAnswers,
      ...quantAnswers,
    };
    onReTailor(combined);
  }

  return (
    <div className="space-y-6">
      {/* Validation banner */}
      <div
        className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${
          validation.passed
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-300 text-red-800'
        }`}
      >
        <span>{validation.passed ? '✓' : '✕'}</span>
        <span>
          {validation.passed
            ? `Validation passed — ${validation.checked_bullets_count ?? 0} bullets checked, no fabrications found`
            : `Validation failed — ${validation.fabrications_found?.length ?? 0} fabrication(s) found across ${validation.checked_bullets_count ?? 0} bullets`}
        </span>
      </div>

      {/* Fabrication details */}
      {!validation.passed && validation.fabrications_found?.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-red-800 text-sm">Fabrications detected</h4>
          {validation.fabrications_found.map((f, i) => (
            <div key={i} className="text-xs text-red-700 space-y-0.5 border-t border-red-100 pt-2">
              <div>
                <span className="font-medium">Bullet: </span>
                {f.bullet}
              </div>
              <div>
                <span className="font-medium">Claim: </span>
                {f.claim}
              </div>
              <div>
                <span className="font-medium">Reason: </span>
                {f.reason}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {validation.warnings?.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-1">
          <h4 className="font-semibold text-yellow-800 text-sm">Warnings</h4>
          {validation.warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-800">
              — {typeof w === 'string' ? w : JSON.stringify(w)}
            </p>
          ))}
        </div>
      )}

      {/* Pre-apply flags */}
      {(blockingFlags.length > 0 || advisoryFlags.length > 0) && (
        <div className="space-y-2">
          {blockingFlags.map((f, i) => (
            <div key={i} className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-800">
              <span className="font-semibold uppercase text-xs mr-2 tracking-wide">Blocking</span>
              {f.message}
            </div>
          ))}
          {advisoryFlags.map((f, i) => (
            <div
              key={i}
              className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800"
            >
              <span className="font-semibold uppercase text-xs mr-2 tracking-wide">Advisory</span>
              {f.message}
            </div>
          ))}
        </div>
      )}

      {/* Tailoring summary */}
      {output.tailoring_summary && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <h3 className="font-semibold text-blue-900">Tailoring approach</h3>
          <p className="text-sm text-blue-800">{output.tailoring_summary.overall_approach}</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {output.tailoring_summary.experience_tier && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {output.tailoring_summary.experience_tier}
              </span>
            )}
            {output.tailoring_summary.tone_register && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {output.tailoring_summary.tone_register}
              </span>
            )}
            {output.tailoring_summary.high_priority_categories?.map((c, i) => (
              <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                {typeof c === 'string' ? c : JSON.stringify(c)}
              </span>
            ))}
          </div>
          {output.tailoring_summary.cannot_cover_by_tailoring?.length > 0 && (
            <p className="text-xs text-red-700">
              <span className="font-medium">Cannot cover by tailoring: </span>
              {output.tailoring_summary.cannot_cover_by_tailoring
                .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
                .join('; ')}
            </p>
          )}
        </div>
      )}

      {/* Tailored experience */}
      {output.tailored_experience?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Tailored experience</h3>
          {output.tailored_experience.map((role, i) => {
            const roleKey = role.role_id || String(i);
            return (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="font-medium text-gray-900 text-sm">
                    {role.title} — {role.company}
                  </div>
                  <div className="text-xs text-gray-500">{role.period}</div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Original
                    </div>
                    <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
                      {role.original_description}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-700 uppercase mb-2">
                      Tailored
                    </div>
                    <ul className="space-y-1.5">
                      {role.tailored_bullets?.map((b, j) => (
                        <li key={j} className="text-xs text-gray-800 flex items-start gap-1.5">
                          <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                          {typeof b === 'string' ? b : JSON.stringify(b)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {role.changes_made?.length > 0 && (
                  <div className="px-4 pb-3 pt-2 flex flex-wrap gap-1 border-t border-gray-100">
                    {role.changes_made.map((c, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100"
                      >
                        {typeof c === 'string' ? c : JSON.stringify(c)}
                      </span>
                    ))}
                  </div>
                )}

                {role.quantification_prompts?.length > 0 && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-2">
                    <div className="text-xs font-medium text-gray-500">Quantification prompts</div>
                    {role.quantification_prompts.map((prompt, j) => {
                      const key = `quant_${roleKey}_${j}`;
                      return (
                        <div key={j} className="flex items-start gap-2">
                          <label className="text-xs text-gray-600 flex-1 pt-1.5">{typeof prompt === 'string' ? prompt : JSON.stringify(prompt)}</label>
                          <input
                            type="text"
                            className="text-xs border border-gray-300 rounded px-2 py-1.5 w-36 text-gray-900 shrink-0"
                            placeholder="Your answer"
                            value={quantAnswers[key] ?? ''}
                            onChange={(e) =>
                              setQuantAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tailored skills */}
      {(skillsData.tailored_skills?.length > 0 || skillsData.deprioritised_skills?.length > 0) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Tailored skills</h3>
          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            {skillsData.tailored_skills?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  Prioritised
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillsData.tailored_skills.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                    >
                      {typeof s === 'string' ? s : JSON.stringify(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skillsData.deprioritised_skills?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  Deprioritised
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillsData.deprioritised_skills.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-gray-50 text-gray-400 rounded-full border border-gray-200"
                    >
                      {typeof s === 'string' ? s : JSON.stringify(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skillsData.changes_made?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {skillsData.changes_made.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100"
                  >
                    {typeof c === 'string' ? c : JSON.stringify(c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional summary */}
      {output.tailored_summary &&
        (output.tailored_summary.original || output.tailored_summary.tailored) && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">Professional summary</h3>
            <div className="p-4 border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Original</div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {output.tailored_summary.original || '(none in original CV)'}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 uppercase mb-2">Tailored</div>
                <p className="text-xs text-gray-800 leading-relaxed">
                  {output.tailored_summary.tailored}
                </p>
              </div>
            </div>
            {output.tailored_summary.changes_made?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {output.tailored_summary.changes_made.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100"
                  >
                    {typeof c === 'string' ? c : JSON.stringify(c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Gap questions */}
      {output.gap_questions?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Answer these to improve tailoring</h3>
          {output.gap_questions.map((q) => (
            <div
              key={q.question_id}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5"
            >
              <div className="text-sm text-gray-800 font-medium">{q.question}</div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Why it matters: </span>
                {q.why_it_matters}
              </div>
              <input
                type="text"
                className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-900"
                placeholder={q.example_answer}
                value={gapAnswers[q.question_id] ?? ''}
                onChange={(e) =>
                  setGapAnswers((prev) => ({ ...prev, [q.question_id]: e.target.value }))
                }
              />
            </div>
          ))}
          <button
            onClick={handleReTailor}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Re-tailor with these answers
          </button>
        </div>
      )}

      {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Tailored Resume'}
        </button>
        <button
          disabled
          title="PDF download coming in next task"
          className="flex-1 py-3 bg-gray-200 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
