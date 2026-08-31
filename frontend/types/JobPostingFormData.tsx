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