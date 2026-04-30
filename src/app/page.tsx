'use client';

import { useState } from 'react';


export default function Home() {
  const [jd, setJd] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleScore() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Job Fit Scorer</h1>
        <p className="text-gray-500">Paste a job description to get a fit score.</p>

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
          {loading ? 'Scoring…' : 'Score This Job'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-blue-600">{result.overall_score as number}</span>
              <span className="text-gray-400 text-lg">/ 100</span>
            </div>
            <pre className="text-xs text-gray-600 bg-gray-50 rounded p-3 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
