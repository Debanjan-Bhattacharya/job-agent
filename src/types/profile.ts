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
  description: string;
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
}
