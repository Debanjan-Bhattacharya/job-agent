'use client';

import { useState } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import ProfileCard from '@/components/ProfileCard';
import JDCard from '@/components/JDCard';
import ScoreResult from '@/components/ScoreResult';
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

  function handleParsed(p: ParsedProfile, text: string) {
    setProfile(p);
    setRawText(text);
  }

  async function handleScore() {
    setLoading(true);
    setError('');
    setResult(null);
    setParsedJD(null);

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

  const isMatch = result?.response_type === 'match';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl space-y-10">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Agent</h1>
          <p className="text-gray-500 mt-1">Upload your resume, then paste a job description to score your fit.</p>
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
            isMatch
              ? <ScoreResult result={result} />
              : (
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )
          )}
        </section>

      </div>
    </main>
  );
}
