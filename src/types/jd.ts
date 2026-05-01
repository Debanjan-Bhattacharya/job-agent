export interface ParsedJD {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  industry: string;
  seniority: string;
  experience_required: { min: number; max: number };
  must_haves: string[];
  nice_to_haves: string[];
  responsibilities: string[];
  impact_metrics: string[];
  raw_jd: string;
}
