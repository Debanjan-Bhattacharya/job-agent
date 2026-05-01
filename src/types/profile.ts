export interface Skill {
  name: string;
  years: number;
}

export interface WorkExperience {
  title: string;
  company: string;
  industry: string;
  start: string;
  end: string | null;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface ParsedProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  total_years_experience: number;
  experience_tier: string;
  experience_tier_override: string | null;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  achievements: string[];
  work_arrangement_preference?: 'wfh' | 'wfo' | 'hybrid' | 'any';
  work_arrangement_hard_filter?: boolean;
  career_break?: {
    detected: boolean;
    context?: string;
  };
  candidate_supplied_context?: Record<string, string>;
}
