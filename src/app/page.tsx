'use client';

import { useState } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import ProfileCard from '@/components/ProfileCard';
import JDCard from '@/components/JDCard';
import ScoreResult from '@/components/ScoreResult';
import TailoredResumeView from '@/components/TailoredResumeView';
import type { ParsedProfile } from '@/types/profile';
import type { ParsedJD } from '@/types/jd';

export default function Home() {
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [rawText, setRawText] = useState('');
  const [jd, setJd] = useState('');
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const [tailoredOutput, setTailoredOutput] = useState<Record<string, unknown> | null>(null);
  const [validationResult, setValidationResult] = useState<Record<string, unknown> | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [tailoringStatus, setTailoringStatus] = useState('');
  const [candidateSuppliedContext, setCandidateSuppliedContext] = useState<
    Record<string, string>
  >({});

  function handleParsed(p: ParsedProfile, text: string) {
    setProfile(p);
    setRawText(text);
  }

  async function handleScore() {
    setLoading(true);
    setError('');
    setResult(null);
    setParsedJD(null);
    setTailoredOutput(null);
    setValidationResult(null);
    setCandidateSuppliedContext({});

    try {
      // Step 1 — parse the JD for JDCard display (best-effort, non-blocking)
      setStatusMsg('Parsing job description…');
      const parseRes = await fetch('/api/jd/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jd }),
      });
      if (parseRes.ok) {
        const parsed: ParsedJD = await parseRes.json();
        setParsedJD(parsed);
      }

      // Step 2 — score (three-case: JD only, CV only, or full match)
      setStatusMsg(profile ? 'Analysing JD and CV…' : 'Analysing job description…');
      const scoreRes = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jd,
          candidate_profile: profile ?? undefined,
        }),
      });
      if (!scoreRes.ok) throw new Error('Scoring failed');
      const data: Record<string, unknown> = await scoreRes.json();
      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  }

  async function handleTailor(suppliedContext: Record<string, string> = {}) {
    if (!result || result.response_type !== 'match' || !profile) return;

    setTailoring(true);
    setError('');
    setTailoredOutput(null);
    setValidationResult(null);

    try {
      const jd_analysis = result.jd_analysis;
      const cv_analysis = result.cv_analysis;
      const match_scoring = Object.fromEntries(
        Object.entries(result).filter(
          ([k]) => !['jd_analysis', 'cv_analysis', 'response_type'].includes(k),
        ),
      );

      setTailoringStatus('Tailoring resume…');
      const tailorRes = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_profile: profile,
          jd_analysis,
          cv_analysis,
          match_scoring,
          candidate_supplied_context: suppliedContext,
        }),
      });
      if (tailorRes.status === 429) {
        const err = (await tailorRes.json()) as { error: string };
        throw new Error(err.error);
      }
      if (!tailorRes.ok) throw new Error('Tailoring failed');
      const tailored: Record<string, unknown> = await tailorRes.json();
      setTailoredOutput(tailored);

      setTailoringStatus('Validating tailored resume…');
      const validateRes = await fetch('/api/resume/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_profile: profile, tailored_output: tailored }),
      });
      if (!validateRes.ok) throw new Error('Validation failed');
      const validation: Record<string, unknown> = await validateRes.json();
      setValidationResult(validation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setTailoring(false);
      setTailoringStatus('');
    }
  }

  function handleReTailor(context: Record<string, string>) {
    setCandidateSuppliedContext(context);
    void handleTailor(context);
  }

  const isMatch = result?.response_type === 'match';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl space-y-10">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Agent</h1>
          <p className="text-gray-500 mt-1">
            Upload your resume, then paste a job description to score your fit.
          </p>
        </div>

        {/* Resume */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Resume</h2>
          <ResumeUpload onParsed={handleParsed} />
          {profile && <ProfileCard profile={profile} rawText={rawText} />}
        </section>

        {/* JD scorer */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Job Description</h2>
          <textarea
            className="w-full h-56 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
            placeholder="Paste job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            onInput={(e) => setJd((e.target as HTMLTextAreaElement).value)}
          />
          <button
            onClick={handleScore}
            disabled={loading || !jd.trim()}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? statusMsg || 'Working…' : 'Score This Job'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Structured JD summary */}
          {parsedJD && <JDCard jd={parsedJD} />}

          {/* Score result */}
          {result && (
            isMatch ? (
              <ScoreResult result={result} />
            ) : (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )
          )}

          {/* Tailor button — shown after a successful match score */}
          {isMatch && (
            <button
              onClick={() => void handleTailor(candidateSuppliedContext)}
              disabled={tailoring}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tailoring
                ? tailoringStatus || 'Working…'
                : tailoredOutput
                ? 'Re-tailor Resume'
                : 'Tailor My Resume'}
            </button>
          )}

          {/* Tailored resume view */}
          {tailoredOutput && validationResult && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Tailored Resume</h2>
              <TailoredResumeView
                tailoredOutput={tailoredOutput}
                originalProfile={profile!}
                validationResult={validationResult}
                candidateSuppliedContext={candidateSuppliedContext}
                onReTailor={handleReTailor}
              />
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
