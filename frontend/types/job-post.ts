// Job post related types for the application

export interface JobPostingFormData {
  // Overview tab
  jobType: string;
  category: string;
  subCategory: string;

  // Job Details tab
  jobTitle: string;
  rolesResponsibilities: string;
  skillsRequired: string;
  benefits: string;

  // Contract tab
  jobRole: string;
  contractDuration: string;
  experienceLevel: string;
  isContractToHire: string;
  workplaceType: string;
  location: string;

  // Budget tab
  budget: string;
  paymentPeriod: string;
  minBudget: string;
  maxBudget: string;
  isUnpaidInternship: boolean;
  isVolunteering: boolean;

  // Application tab
  applicationCategory: string;
  applicationQuestions: string[];
}

export interface JobPost {
  job_id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  skills: string[];
  experience_level: string;
  project_type: string;
  timeline: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  applications_count: number;
  created_at: number;
  updated_at: number;

  // Additional fields that might be in the API
  sub_category?: string;
  benefits?: string;
  job_role?: string;
  is_contract_to_hire?: boolean;
  workplace_type?: string;
  location?: string;
  payment_period?: string;
  is_unpaid_internship?: boolean;
  is_volunteering?: boolean;
  application_category?: string;
  application_questions?: string[];
}

export interface JobPostCreateRequest {
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  skills: string[];
  experience_level: string;
  project_type: string;
  timeline: string;

  // Additional optional fields
  sub_category?: string;
  benefits?: string;
  job_role?: string;
  is_contract_to_hire?: boolean;
  workplace_type?: string;
  location?: string;
  payment_period?: string;
  is_unpaid_internship?: boolean;
  is_volunteering?: boolean;
  application_category?: string;
  application_questions?: string[];
}

export interface JobPostUpdateRequest {
  title?: string;
  description?: string;
  budget?: number;
  deadline?: string;
  category?: string;
  skills?: string[];
  experience_level?: string;
  project_type?: string;
  timeline?: string;
  status?: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface JobPostAPIResponse {
  success: boolean;
  data?: JobPost | JobPost[];
  error?: string;
}

export interface JobPostListFilter {
  category?: string;
  client_id?: string;
  search_term?: string;
  limit?: number;
  offset?: number;
}