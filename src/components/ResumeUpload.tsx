'use client';

import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import type { ParsedProfile } from '@/types/profile';

interface Props {
  onParsed: (profile: ParsedProfile, rawText: string) => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function validate(file: File): string | null {
  const typeOk = ACCEPTED_TYPES.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx');
  if (!typeOk) return 'Only PDF and .docx files are supported.';
  if (file.size > 5 * 1024 * 1024) return 'File must be under 5MB.';
  return null;
}

export default function ResumeUpload({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) { setError(err); return; }

    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/resume/parse', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Parsing failed');
      onParsed(data.profile, data.raw_text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
          loading
            ? 'border-gray-200 bg-gray-50 cursor-default'
            : dragging
            ? 'border-blue-500 bg-blue-50 cursor-copy'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={onInputChange}
        />
        {loading ? (
          <p className="text-gray-500 text-sm">Parsing resume…</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">
              {dragging ? 'Drop to upload' : 'Drop your resume here or click to upload'}
            </p>
            <p className="text-gray-400 text-sm mt-1">PDF or .docx · max 5 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
