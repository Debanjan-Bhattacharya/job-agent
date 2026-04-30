'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ParsedProfile, Skill, WorkExperience, Education } from '@/types/profile';

interface Props {
  profile: ParsedProfile;
  rawText: string;
}

const TIERS = ['grad', 'mid', 'mid-senior', 'senior'];

const inputCls =
  'border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function ProfileCard({ profile, rawText }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [committed, setCommitted] = useState<ParsedProfile>({ ...profile });
  const [edited, setEdited] = useState<ParsedProfile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── top-level scalar fields ──────────────────────────────────────────────
  function setField<K extends keyof ParsedProfile>(key: K, value: ParsedProfile[K]) {
    setEdited(prev => ({ ...prev, [key]: value }));
  }

  // ── skills ───────────────────────────────────────────────────────────────
  function updateSkill(i: number, field: keyof Skill, value: string | number) {
    setEdited(prev => {
      const skills = [...prev.skills];
      skills[i] = { ...skills[i], [field]: value };
      return { ...prev, skills };
    });
  }
  function addSkill() {
    setEdited(prev => ({ ...prev, skills: [...prev.skills, { name: '', years: 0 }] }));
  }
  function removeSkill(i: number) {
    setEdited(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));
  }

  // ── experience ───────────────────────────────────────────────────────────
  function updateExperience(i: number, field: keyof WorkExperience, value: string | null) {
    setEdited(prev => {
      const experience = [...prev.experience];
      experience[i] = { ...experience[i], [field]: value };
      return { ...prev, experience };
    });
  }
  function addExperience() {
    setEdited(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: '', company: '', industry: '', start: '', end: null, description: '' },
      ],
    }));
  }
  function removeExperience(i: number) {
    setEdited(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));
  }

  // ── education ────────────────────────────────────────────────────────────
  function updateEducation(i: number, field: keyof Education, value: string | number) {
    setEdited(prev => {
      const education = [...prev.education];
      education[i] = { ...education[i], [field]: value };
      return { ...prev, education };
    });
  }
  function addEducation() {
    setEdited(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: 0 }],
    }));
  }
  function removeEducation(i: number) {
    setEdited(prev => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }));
  }

  // ── achievements ─────────────────────────────────────────────────────────
  function updateAchievement(i: number, value: string) {
    setEdited(prev => {
      const achievements = [...prev.achievements];
      achievements[i] = value;
      return { ...prev, achievements };
    });
  }
  function addAchievement() {
    setEdited(prev => ({ ...prev, achievements: [...prev.achievements, ''] }));
  }
  function removeAchievement(i: number) {
    setEdited(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, idx) => idx !== i),
    }));
  }

  // ── save / cancel ────────────────────────────────────────────────────────
  function handleCancel() {
    setEdited({ ...committed });
    setIsEditing(false);
    setSaveError('');
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await supabase.from('candidate_profiles').insert({
        user_id: null,
        raw_text: rawText,
        parsed_profile: edited,
      });
      if (error) throw error;
      setCommitted({ ...edited });
      setSaved(true);
      setIsEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const p = isEditing ? edited : committed;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">

      {/* ── header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              className={`${inputCls} text-lg font-bold w-full mb-2`}
              value={edited.name}
              placeholder="Full name"
              onChange={e => setField('name', e.target.value)}
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900 truncate">{p.name || '—'}</h2>
          )}
          {isEditing ? (
            <div className="flex flex-wrap gap-2 mt-1">
              <input className={inputCls} value={edited.email} placeholder="Email" onChange={e => setField('email', e.target.value)} />
              <input className={inputCls} value={edited.phone} placeholder="Phone" onChange={e => setField('phone', e.target.value)} />
              <input className={inputCls} value={edited.location} placeholder="Location" onChange={e => setField('location', e.target.value)} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mt-1">
              {p.email && <span>{p.email}</span>}
              {p.phone && <span>{p.phone}</span>}
              {p.location && <span>{p.location}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
            {p.experience_tier}
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-3 py-1"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* ── tier + years (edit only) ── */}
      {isEditing && (
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Years of experience</span>
            <input
              type="number"
              min={0}
              className={`${inputCls} w-24`}
              value={edited.total_years_experience}
              onChange={e => setField('total_years_experience', parseInt(e.target.value) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Experience tier</span>
            <select
              className={inputCls}
              value={edited.experience_tier}
              onChange={e => setField('experience_tier', e.target.value)}
            >
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Tier override</span>
            <select
              className={inputCls}
              value={edited.experience_tier_override ?? ''}
              onChange={e => setField('experience_tier_override', e.target.value || null)}
            >
              <option value="">none</option>
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* ── skills ── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</h3>
        {isEditing ? (
          <div className="space-y-1">
            {edited.skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Skill"
                  value={skill.name}
                  onChange={e => updateSkill(i, 'name', e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  className={`${inputCls} w-20`}
                  placeholder="yrs"
                  value={skill.years}
                  onChange={e => updateSkill(i, 'years', parseInt(e.target.value) || 0)}
                />
                <button onClick={() => removeSkill(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
              </div>
            ))}
            <button onClick={addSkill} className="text-blue-600 hover:text-blue-800 text-sm mt-1">+ Add skill</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {p.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {skill.name}
                {skill.years > 0 && <span className="text-gray-400 ml-1">{skill.years}y</span>}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── experience ── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience</h3>
        {isEditing ? (
          <div className="space-y-3">
            {edited.experience.map((exp, i) => (
              <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
                <div className="flex gap-2">
                  <input className={`${inputCls} flex-1`} placeholder="Title" value={exp.title} onChange={e => updateExperience(i, 'title', e.target.value)} />
                  <input className={`${inputCls} flex-1`} placeholder="Company" value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <input className={`${inputCls} flex-1`} placeholder="Industry" value={exp.industry} onChange={e => updateExperience(i, 'industry', e.target.value)} />
                  <input className={`${inputCls} w-28`} placeholder="Start YYYY-MM" value={exp.start} onChange={e => updateExperience(i, 'start', e.target.value)} />
                  <input className={`${inputCls} w-28`} placeholder="End (blank=now)" value={exp.end ?? ''} onChange={e => updateExperience(i, 'end', e.target.value || null)} />
                </div>
                <textarea
                  rows={2}
                  className={`${inputCls} w-full resize-none`}
                  placeholder="Description"
                  value={exp.description}
                  onChange={e => updateExperience(i, 'description', e.target.value)}
                />
                <button onClick={() => removeExperience(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
            ))}
            <button onClick={addExperience} className="text-blue-600 hover:text-blue-800 text-sm">+ Add experience</button>
          </div>
        ) : (
          <div className="space-y-4">
            {p.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-gray-900 text-sm">{exp.title}</span>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                    {exp.start}{exp.start ? ' — ' : ''}{exp.end ?? 'present'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {exp.company}{exp.industry ? ` · ${exp.industry}` : ''}
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── education ── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</h3>
        {isEditing ? (
          <div className="space-y-2">
            {edited.education.map((edu, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Degree" value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} />
                <input className={`${inputCls} flex-1`} placeholder="Institution" value={edu.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} />
                <input type="number" className={`${inputCls} w-20`} placeholder="Year" value={edu.year || ''} onChange={e => updateEducation(i, 'year', parseInt(e.target.value) || 0)} />
                <button onClick={() => removeEducation(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
              </div>
            ))}
            <button onClick={addEducation} className="text-blue-600 hover:text-blue-800 text-sm">+ Add education</button>
          </div>
        ) : (
          <div className="space-y-1">
            {p.education.map((edu, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-gray-800">{edu.degree}</span>
                {edu.institution && <span className="text-gray-500"> · {edu.institution}</span>}
                {edu.year > 0 && <span className="text-gray-400"> · {edu.year}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── achievements ── */}
      {(p.achievements.length > 0 || isEditing) && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Achievements</h3>
          {isEditing ? (
            <div className="space-y-1">
              {edited.achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    value={a}
                    onChange={e => updateAchievement(i, e.target.value)}
                  />
                  <button onClick={() => removeAchievement(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                </div>
              ))}
              <button onClick={addAchievement} className="text-blue-600 hover:text-blue-800 text-sm">+ Add achievement</button>
            </div>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {p.achievements.map((a, i) => (
                <li key={i} className="text-sm text-gray-600">{a}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── actions ── */}
      {isEditing && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save to profile'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
        </div>
      )}
      {saved && !isEditing && (
        <p className="text-green-600 text-sm">Profile saved.</p>
      )}
    </div>
  );
}
