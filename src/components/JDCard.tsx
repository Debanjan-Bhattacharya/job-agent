'use client';

import type { ParsedJD } from '@/types/jd';

interface Props {
  jd: ParsedJD;
}

export default function JDCard({ jd }: Props) {
  const expRange =
    jd.experience_required.min === 0 && jd.experience_required.max === 0
      ? null
      : jd.experience_required.max === 0
      ? `${jd.experience_required.min}+ yrs`
      : jd.experience_required.min === jd.experience_required.max
      ? `${jd.experience_required.min} yrs`
      : `${jd.experience_required.min}–${jd.experience_required.max} yrs`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">

      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{jd.title || 'Untitled Role'}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
            {jd.company && <span>{jd.company}</span>}
            {(jd.location || jd.remote) && (
              <span>{jd.remote ? 'Remote' : jd.location}</span>
            )}
            {jd.industry && <span>{jd.industry}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {jd.seniority && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
              {jd.seniority}
            </span>
          )}
          {expRange && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full whitespace-nowrap">
              {expRange}
            </span>
          )}
          {jd.remote && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">
              Remote
            </span>
          )}
        </div>
      </div>

      {/* must-haves */}
      {jd.must_haves.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Must-haves</h4>
          <ul className="space-y-1">
            {jd.must_haves.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* nice-to-haves */}
      {jd.nice_to_haves.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nice-to-haves</h4>
          <ul className="space-y-1">
            {jd.nice_to_haves.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* impact metrics */}
      {jd.impact_metrics.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Impact metrics</h4>
          <ul className="space-y-1">
            {jd.impact_metrics.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
